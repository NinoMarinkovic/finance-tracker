# Finance Tracker

A full-stack personal finance web application built with Python, Flask and MySQL.

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

## Project Structure

```
finance-tracker/
├── project.py          # Flask backend & REST API
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

3. Create the database in phpMyAdmin (or MySQL CLI)
```sql
CREATE DATABASE ledger;
```

4. Start the app
```bash
python project.py
```

5. Open your browser
```
http://127.0.0.1:5000
```

The database tables are created automatically on first launch.

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
