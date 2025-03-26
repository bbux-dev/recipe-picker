import sqlite3
from datetime import date

DB_NAME = "meals.db"

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS weekly_meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meal_name TEXT NOT NULL,
                week_start DATE NOT NULL
            )
        ''')
        conn.commit()


# Test it
if __name__ == "__main__":
    init_db()
    print(f"Database '{DB_NAME}' initialized with table 'weekly_meals'.")
