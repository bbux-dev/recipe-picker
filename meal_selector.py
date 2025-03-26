import random
from datetime import date
from random import random


def is_seasonal_ok(meal: dict, today: date) -> bool:
    if 'seasonal' not in meal:
        return True
    months = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sept": 9, "Oct": 10, "Nov": 11, "Dec": 12
    }
    seasonal = meal['seasonal']
    start_str, end_str = seasonal.split("-")
    start_month = months[start_str]
    end_month = months[end_str]
    current_month = today.month
    if start_month <= end_month:
        return start_month <= current_month <= end_month
    else:
        return current_month >= start_month or current_month <= end_month


def pick_meals(meals, recent_meals, today: date = date.today(), max_hard=1, count=4):
    filtered = [
        m for m in meals
        if m['name'] not in recent_meals and is_seasonal_ok(m, today)
    ]
    random.shuffle(filtered)

    selected = []
    ethnicities = set()
    hard_count = 0

    for meal in filtered:
        if meal['ethnicity'] in ethnicities:
            continue
        if meal.get('difficulty', 'easy') == 'hard':
            if hard_count >= max_hard:
                continue
            hard_count += 1
        ethnicities.add(meal['ethnicity'])
        selected.append(meal)
        if len(selected) == count:
            break

    return selected
