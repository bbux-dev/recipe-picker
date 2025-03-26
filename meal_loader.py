import json
import sqlite3
from typing import List, Dict

from datetime import timedelta, date

from initdb import DB_NAME


def load_meals(filename: str = "meals.json") -> List[Dict]:
    with open(filename, 'r', encoding='utf-8') as f:
        meals = json.load(f)
    return meals


def get_recent_meals(weeks: int = 3) -> list:
    start_date = date.today() - timedelta(weeks=weeks)
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute('''
            SELECT DISTINCT meal_name FROM weekly_meals
            WHERE week_start >= ?
        ''', (start_date.isoformat(),))
        rows = c.fetchall()
        return [row[0] for row in rows]


# Test it
if __name__ == "__main__":
    meals = load_meals()
    for meal in meals:
        print(meal)
