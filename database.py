"""SQLite archive; automatically migrates v0.2 data."""
import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".legalmind" / "legalmind.db"


class Database:
    def __init__(self, path=DB_PATH):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        self.con = sqlite3.connect(path)
        self.con.row_factory = sqlite3.Row
        with self.con:
            self.con.execute(
                """CREATE TABLE IF NOT EXISTS cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                argument TEXT NOT NULL,
                xp INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"""
            )
            columns = {row["name"] for row in self.con.execute("PRAGMA table_info(cases)")}
            for col, typ in (("mode", "TEXT"), ("score", "INTEGER"), ("feedback", "TEXT")):
                if col not in columns:
                    self.con.execute(f"ALTER TABLE cases ADD COLUMN {col} {typ}")

    def save_case(self, title, argument, xp=10, mode="scenario", score=None, feedback=""):
        with self.con:
            self.con.execute(
                "INSERT INTO cases (title,argument,xp,mode,score,feedback) VALUES (?,?,?,?,?,?)",
                (title, argument, xp, mode, score, feedback),
            )

    def get_stats(self):
        row = self.con.execute("SELECT COUNT(*) AS cases, COALESCE(SUM(xp),0) AS xp FROM cases").fetchone()
        xp = row["xp"]
        rank = "SENIOR ATTORNEY" if xp >= 500 else "ATTORNEY" if xp >= 150 else "LAW STUDENT"
        return {"cases": row["cases"], "xp": xp, "rank": rank}

    def get_cases(self):
        return [dict(row) for row in self.con.execute(
            "SELECT title,argument,xp,created_at,mode,score,feedback FROM cases ORDER BY id DESC LIMIT 20"
        )]
