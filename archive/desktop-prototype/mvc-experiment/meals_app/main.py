from random import random

from controller.main_controller import MainController
from model.meal import Meal
from view import MainWindow

def select_suggested_meals(meals, count=4, max_hard=1):
    random.shuffle(meals)
    selected = []
    ethnicities = set()
    hard_count = 0
    disliked_count = 0

    for meal in meals:
        ethnicity = meal.get("ethnicity", "")
        difficulty = meal.get("difficulty", "easy")
        disliked = len(meal.get('disliked_by', [])) > 0

        if ethnicity != 'American' and ethnicity in ethnicities:
            continue
        if disliked and disliked_count > 0:
            continue
        if difficulty == "hard":
            if hard_count >= max_hard:
                continue
            hard_count += 1
        if disliked:
            disliked_count += 1

        selected.append(meal)
        ethnicities.add(ethnicity)

        if len(selected) == count:
            break

    return selected

controller = MainController()
view = MainWindow(controller, suggest_function=select_suggested_meals)
view.show()