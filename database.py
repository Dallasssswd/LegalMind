"""Local SQLite save data for LegalMind."""
import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".legalmind" / "legalmind.db"


class Database:
    def __init__(self, path=DB_PATH):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path)
        self.connection.row_factory = sqlite3.Row
        with self.connection:
            self.connection.execute(
                """CREATE TABLE IF NOT EXISTS cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    argument TEXT NOT NULL,
                    xp INTEGER NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )"""
            )

    def save_case(self, title, argument, xp=10):
        with self.connection:
            self.connection.execute(
                "INSERT INTO cases (title, argument, xp) VALUES (?, ?, ?)",
                (title, argument, xp)
            )

    def get_stats(self):
        row = self.connection.execute(
            "SELECT COUNT(*) AS cases, COALESCE(SUM(xp), 0) AS xp FROM cases"
        ).fetchone()
        xp = row["xp"]
        rank = "SENIOR ATTORNEY" if xp >= 500 else "ATTORNEY" if xp >= 150 else "LAW STUDENT"
        return {"cases": row["cases"], "xp": xp, "rank": rank}

    def get_cases(self):
        rows = self.connection.execute(
            "SELECT title, argument, xp, created_at FROM cases ORDER BY id DESC LIMIT 20"
        ).fetchall()
        return [dict(row) for row in rows]
