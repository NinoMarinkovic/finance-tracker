# Ledger — Personal Finance App

Python Flask Backend + HTML/CSS/JS Frontend

## Projektstruktur

```
ledger_app/
├── server.py              ← Flask-Backend (alle Python-Logik)
├── templates/
│   └── index.html         ← HTML (wird von Flask gerendert)
└── static/
    ├── style.css          ← Design
    └── app.js             ← UI-Logik + API-Calls
```

## Setup & Start

### 1. Flask installieren
```bash
pip install flask
```

### 2. App starten
```bash
python server.py
```

### 3. Im Browser öffnen
```
http://127.0.0.1:5000
```

## Was im Backend läuft (server.py)

| Python-Funktion      | Flask-Route                        |
|---------------------|------------------------------------|
| `validate_email()`  | POST `/api/register`               |
| `validate_password()`| POST `/api/register`              |
| `validate_credit_card()` | POST `/api/register`          |
| `hash_password()`   | POST `/api/register`               |
| `verify_password()` | POST `/api/login`                  |
| `mask_credit_card()`| POST `/api/register`               |
| `calculate_total()` | GET `/api/transactions`            |
| `total_by_category()` | GET `/api/transactions/category` |

Alle Daten werden im Arbeitsspeicher gehalten (kein Datenbankfile nötig).
