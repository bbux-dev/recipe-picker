import sqlite3
from datetime import date

DB_NAME = "meals.db"

def get_last_meal_entries(limit=3):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("""
            SELECT meal_name, week_start
            FROM weekly_meals
            ORDER BY week_start DESC
            LIMIT ?
        """, (limit,))
        return c.fetchall()


def get_last_date():
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("SELECT MAX(week_start) FROM weekly_meals")
        result = c.fetchone()
        return result[0] if result and result[0] else None


def insert_meal(meal_name, week_start):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("""
            INSERT INTO weekly_meals (meal_name, week_start)
            VALUES (?, ?)
        """, (meal_name, week_start))
        conn.commit()


def delete_meal_entry(meal_name, week_start):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("""
            DELETE FROM weekly_meals
            WHERE meal_name = ? AND week_start = ?
        """, (meal_name, week_start))
        conn.commit()