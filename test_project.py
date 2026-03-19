# ----------------------
# Imports
# ----------------------

import pytest
from project import (
    validate_email,
    validate_password,
    validate_credit_card,
    hash_password,
    verify_password,
    mask_credit_card,
    calculate_total,
    total_by_category,
)


# ----------------------
# Test: validate_email
# ----------------------

def test_validate_email():

    assert validate_email("user@example.com") is True
    assert validate_email("test.name+tag@domain.co") is True
    assert validate_email("hello123@sub.domain.org") is True

    assert validate_email("missing-at.com") is False
    assert validate_email("@no-local.com") is False
    assert validate_email("user@.com") is False
    assert validate_email("user@domain") is False
    assert validate_email("") is False


# ----------------------
# Test: validate_password
# ----------------------

def test_validate_password():

    assert validate_password("Abcd1@") is True
    assert validate_password("StrongPass1#") is True

    assert validate_password("Ab1@") is False        # zu kurz
    assert validate_password("abcd1@") is False      # kein Großbuchstabe
    assert validate_password("ABCD1@") is False      # kein Kleinbuchstabe
    assert validate_password("Abcde@") is False      # keine Zahl
    assert validate_password("Abcde1") is False      # kein Sonderzeichen
    assert validate_password("") is False


# ----------------------
# Test: validate_credit_card
# ----------------------

def test_validate_credit_card():

    assert validate_credit_card("4111111111111111") is True   # Visa
    assert validate_credit_card("5111111111111111") is True   # Mastercard
    assert validate_credit_card("5511111111111111") is True   # Mastercard

    assert validate_credit_card("411111111111") is False      # zu kurz
    assert validate_credit_card("6111111111111111") is False  # ungültiger Prefix
    assert validate_credit_card("41111111111111ab") is False  # Buchstaben
    assert validate_credit_card("") is False


# ----------------------
# Test: hash_password & verify_password
# ----------------------

def test_hash_and_verify_password():
    password = "MySecret1@"
    hashed = hash_password(password)

    assert verify_password(hashed, password) is True
    assert verify_password(hashed, "WrongPass1@") is False


# ----------------------
# Test: mask_credit_card
# ----------------------

def test_mask_credit_card():
    # Flask-Version gibt "**** **** **** XXXX" zurück
    assert mask_credit_card("4111111111111111") == "**** **** **** 1111"
    assert mask_credit_card("5511111111111111") == "**** **** **** 1111"


# ----------------------
# Test: calculate_total
# ----------------------

def test_calculate_total():
    # calculate_total erwartet eine Liste von Dicts mit "amount"
    t1 = {"amount": 100.0, "category": "Food",      "description": "Groceries"}
    t2 = {"amount": 50.5,  "category": "Transport",  "description": "Bus ticket"}
    t3 = {"amount": 25.0,  "category": "Food",       "description": "Coffee"}

    assert calculate_total([t1, t2, t3]) == 175.5
    assert calculate_total([]) == 0
    assert calculate_total([t1]) == 100.0


# ----------------------
# Test: total_by_category
# ----------------------

def test_total_by_category():
    # total_by_category erwartet ebenfalls Dicts
    t1 = {"amount": 100.0, "category": "Food",      "description": "Groceries"}
    t2 = {"amount": 50.0,  "category": "Transport",  "description": "Bus"}
    t3 = {"amount": 25.0,  "category": "food",       "description": "Coffee"}  # Kleinschreibung

    assert total_by_category([t1, t2, t3], "Food") == 125.0
    assert total_by_category([t1, t2, t3], "Transport") == 50.0
    assert total_by_category([t1, t2, t3], "Unknown") == 0