
import re
import hashlib
from datetime import datetime
import pymysql
from flask import Flask, request, jsonify, session, render_template

app = Flask(__name__)
app.secret_key = 'ledger_secret_key_2024'

# ──────────────────────────────────────────
# Datenbankverbindung
# ──────────────────────────────────────────

DB_CONFIG = {
    'host':        '127.0.0.1',
    'port':        3307,
    'user':        'root',
    'password':    '',
    'db':          'ledger',
    'charset':     'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db():
    return pymysql.connect(**DB_CONFIG)


def init_db():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            INT AUTO_INCREMENT PRIMARY KEY,
                    name          VARCHAR(100)  NOT NULL,
                    email         VARCHAR(150)  NOT NULL UNIQUE,
                    password_hash VARCHAR(255)  NOT NULL,
                    credit_card   VARCHAR(25)   NOT NULL,
                    created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id          INT AUTO_INCREMENT PRIMARY KEY,
                    user_id     INT            NOT NULL,
                    amount      DECIMAL(10,2)  NOT NULL,
                    category    VARCHAR(100)   NOT NULL,
                    description VARCHAR(255)   NOT NULL,
                    date        DATETIME       DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
        conn.commit()
    finally:
        conn.close()


# ══════════════════════════════════════════
# Validation
# ══════════════════════════════════════════

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    reg = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#%])[A-Za-z\d@$#%]{6,20}$"
    return re.search(reg, password) is not None

def validate_credit_card(number):
    regex = r"^(4\d{15}|5[1-5]\d{14})$"
    return re.match(regex, number) is not None


# ══════════════════════════════════════════
# Security
# ══════════════════════════════════════════

def hash_password(password):
    salt = b'ledger_fixed_salt'
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100_000)
    return hashed.hex()

def verify_password(stored_hash, provided_password):
    return hash_password(provided_password) == stored_hash

def mask_credit_card(number):
    number = number.replace(' ', '')
    return '**** **** **** ' + number[-4:]


# ══════════════════════════════════════════
# Business Logic
# ══════════════════════════════════════════

def calculate_total(transactions):
    return sum(float(t['amount']) for t in transactions)

def total_by_category(transactions, category):
    return sum(float(t['amount']) for t in transactions
               if t['category'].lower() == category.lower())


# ══════════════════════════════════════════
# Flask Routes – Seiten
# ══════════════════════════════════════════

@app.route('/')
def index():
    return render_template('index.html')


# ══════════════════════════════════════════
# Flask Routes – API
# ══════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def api_register():
    data     = request.json
    name     = (data.get('name') or '').strip()
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    cc       = (data.get('credit_card') or '').replace(' ', '')

    if not name:
        return jsonify(error='Please enter your full name.'), 400
    if not validate_email(email):
        return jsonify(error='Invalid email address.'), 400
    if not validate_password(password):
        return jsonify(error='Password does not meet the requirements.'), 400
    if not validate_credit_card(cc):
        return jsonify(error='Invalid credit card number. Visa or Mastercard only.'), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return jsonify(error='An account with this email already exists.'), 400
            cur.execute(
                "INSERT INTO users (name, email, password_hash, credit_card) VALUES (%s, %s, %s, %s)",
                (name, email, hash_password(password), mask_credit_card(cc))
            )
        conn.commit()
    finally:
        conn.close()

    return jsonify(message='Account created successfully.'), 201


@app.route('/api/login', methods=['POST'])
def api_login():
    data     = request.json
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
    finally:
        conn.close()

    if not user:
        return jsonify(error='No account found for this email.'), 404

    attempts_key = f'attempts_{email}'
    attempts = session.get(attempts_key, 0)

    if attempts >= 3:
        return jsonify(error='Account locked. Too many failed attempts.', locked=True), 403

    if not verify_password(user['password_hash'], password):
        session[attempts_key] = attempts + 1
        remaining = 3 - session[attempts_key]
        if remaining <= 0:
            return jsonify(error='Account locked.', locked=True, remaining=0), 403
        return jsonify(error='Incorrect password.', remaining=remaining), 401

    session[attempts_key] = 0
    session['user_id']   = user['id']
    session['user_name'] = user['name']
    session['user_cc']   = user['credit_card']

    return jsonify(
        message='Login successful.',
        name=user['name'],
        credit_card=user['credit_card'],
    ), 200


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify(message='Logged out.'), 200


def get_current_user_id():
    return session.get('user_id')


@app.route('/api/transactions', methods=['GET'])
def api_get_transactions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify(error='Not authenticated.'), 401

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM transactions WHERE user_id = %s ORDER BY date DESC",
                (user_id,)
            )
            txs = cur.fetchall()
    finally:
        conn.close()

    for t in txs:
        if isinstance(t['date'], datetime):
            t['date'] = t['date'].strftime('%Y-%m-%d %H:%M:%S')
        t['amount'] = float(t['amount'])

    return jsonify(transactions=txs, balance=calculate_total(txs))


@app.route('/api/transactions', methods=['POST'])
def api_add_transaction():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify(error='Not authenticated.'), 401

    data        = request.json
    amount      = data.get('amount')
    category    = (data.get('category') or '').strip()
    description = (data.get('description') or '').strip()

    if amount is None or not isinstance(amount, (int, float)):
        return jsonify(error='Amount must be a number.'), 400
    if amount == 0:
        return jsonify(error='Amount cannot be zero.'), 400
    if not category:
        return jsonify(error='Category is required.'), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO transactions (user_id, amount, category, description) VALUES (%s, %s, %s, %s)",
                (user_id, amount, category, description or '—')
            )
            conn.commit()
            cur.execute("SELECT amount FROM transactions WHERE user_id = %s", (user_id,))
            all_txs = cur.fetchall()
    finally:
        conn.close()

    balance = sum(float(t['amount']) for t in all_txs)
    return jsonify(message='Transaction added.', balance=balance), 201


@app.route('/api/transactions/category', methods=['GET'])
def api_category_total():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify(error='Not authenticated.'), 401

    category = request.args.get('name', '').strip()
    if not category:
        return jsonify(error='Category name is required.'), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT amount FROM transactions WHERE user_id = %s AND LOWER(category) = LOWER(%s)",
                (user_id, category)
            )
            txs = cur.fetchall()
    finally:
        conn.close()

    total = sum(float(t['amount']) for t in txs)
    return jsonify(category=category, total=total)


# ══════════════════════════════════════════
# Start
# ══════════════════════════════════════════

if __name__ == '__main__':
    init_db()
    app.run(debug=True)