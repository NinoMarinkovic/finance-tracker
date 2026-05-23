# Finance Tracker

A personal finance web app built with Python, Flask and MySQL.

**Live:** https://finance-tracker-ohtz.onrender.com

## Features

- **User Authentication** — Register and login with secure password hashing and a 3-attempt lockout
- **Transaction Management** — Add, view and manage income and expenses
- **Category Filtering** — Calculate totals by spending category
- **Persistent Storage** — All data stored in a MySQL database
- **Responsive UI** — Clean, professional interface that works on all screen sizes
- **Unit Tests** — Core logic covered with pytest

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| Database | MySQL, pymysql |
| Frontend | HTML, CSS, JavaScript |
| Testing | pytest |
| Hosting | Render |
| Database Hosting | Aiven (MySQL Cloud) |

## Project Structure

```
finance-tracker/
├── projects.py         # Flask backend & REST API
├── test_project.py     # Unit tests
├── requirements.txt    # Dependencies
├── README.md
├── templates/
│   └── index.html      # Main HTML template
└── static/
    ├── style.css       # Styling
    └── app.js          # Frontend logic & API calls
```

## Getting Started

### Prerequisites

- Python 3.x
- MySQL (e.g. via XAMPP)
- A running MySQL server with a database named `ledger`

### Installation

1. Clone the repository
```bash
git clone https://github.com/NinoMarinkovic/finance-tracker.git
cd finance-tracker
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Set up environment variables — create a `.env` file:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ledger
```

4. Create the database in phpMyAdmin (or MySQL CLI)
```sql
CREATE DATABASE ledger;
```

5. Start the app
```bash
python projects.py
```

6. Open your browser
```
http://127.0.0.1:5000
```

The database tables are created automatically on first launch.

## Deployment

The app is deployed on **Render** with a cloud MySQL database on **Aiven**.

Environment variables are configured via Render's dashboard — no secrets are stored in the repository.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create a new account |
| POST | `/api/login` | Sign in |
| POST | `/api/logout` | Sign out |
| GET | `/api/transactions` | Get all transactions & balance |
| POST | `/api/transactions` | Add a transaction |
| GET | `/api/transactions/category` | Get total by category |

## Running Tests

```bash
pytest test_project.py
```

## Security

- Passwords are hashed using PBKDF2-HMAC-SHA256
- Credit card numbers are masked before storage
- Login is locked after 3 failed attempts
- Input validation on both client and server side
- Environment variables used for all sensitive config — never hardcoded
