"""SQLite persistence. All money is stored as integer paise."""
from __future__ import annotations
import os, sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.getenv("FINANCE_DB_PATH", Path(__file__).resolve().parents[1] / "data" / "finance.db"))

@contextmanager
def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def initialize():
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, name TEXT NOT NULL, opening_paise INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'INR');
        CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id), amount_paise INTEGER NOT NULL CHECK(amount_paise>0), type TEXT NOT NULL CHECK(type IN ('income','expense','refund','transfer_in','transfer_out')), category TEXT NOT NULL, description TEXT NOT NULL, date TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'manual', fingerprint TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date); CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category);
        CREATE TABLE IF NOT EXISTS budgets(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'All', amount_paise INTEGER NOT NULL CHECK(amount_paise>0), start_date TEXT NOT NULL, end_date TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS goals(id INTEGER PRIMARY KEY, name TEXT NOT NULL, target_paise INTEGER NOT NULL CHECK(target_paise>0), saved_paise INTEGER NOT NULL DEFAULT 0, target_date TEXT, archived INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS contributions(id INTEGER PRIMARY KEY, goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE, amount_paise INTEGER NOT NULL CHECK(amount_paise>0), date TEXT NOT NULL, note TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS import_batches(id INTEGER PRIMARY KEY, filename TEXT NOT NULL, imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, imported_count INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
        """)
        if db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 0:
            db.execute("INSERT INTO accounts(name,opening_paise) VALUES ('Everyday account',0)")

def account_id():
    with connect() as db: return db.execute("SELECT id FROM accounts ORDER BY id LIMIT 1").fetchone()[0]
