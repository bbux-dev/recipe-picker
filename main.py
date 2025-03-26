import sys
import os
import json
import random
from PySide6.QtWidgets import (
    QApplication, QLabel, QVBoxLayout, QWidget,
    QGridLayout, QScrollArea, QMainWindow
)
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt


class MealCard(QWidget):
    def __init__(self, meal):
        super().__init__()
        layout = QVBoxLayout()

        # Load image if available
        image_path = meal.get("image")
        if image_path and os.path.exists(image_path):
            pixmap = QPixmap(image_path).scaledToWidth(150, Qt.SmoothTransformation)
            img_label = QLabel()
            img_label.setPixmap(pixmap)
        else:
            img_label = QLabel("No image")
            img_label.setFixedSize(150, 100)
            img_label.setAlignment(Qt.AlignCenter)

        # Labels
        name_label = QLabel(meal.get("name", "Unnamed Meal"))
        name_label.setAlignment(Qt.AlignCenter)
        name_label.setStyleSheet("font-weight: bold; font-size: 12pt;")

        ethnicity_label = QLabel(f"{meal.get('ethnicity', '')} - {meal.get('difficulty', '')}")
        ethnicity_label.setAlignment(Qt.AlignCenter)
        ethnicity_label.setStyleSheet("color: gray; font-size: 10pt;")

        layout.addWidget(img_label)
        layout.addWidget(name_label)
        layout.addWidget(ethnicity_label)

        self.setLayout(layout)


def select_suggested_meals(meals, count=4, max_hard=1):
    random.shuffle(meals)
    selected = []
    ethnicities = set()
    hard_count = 0

    for meal in meals:
        ethnicity = meal.get("ethnicity", "")
        difficulty = meal.get("difficulty", "easy")

        if ethnicity in ethnicities:
            continue
        if difficulty == "hard":
            if hard_count >= max_hard:
                continue
            hard_count += 1

        selected.append(meal)
        ethnicities.add(ethnicity)

        if len(selected) == count:
            break

    return selected


class MainWindow(QMainWindow):
    def __init__(self, json_path="meals.json"):
        super().__init__()
        self.setWindowTitle("Weekly Meal Suggestions")
        self.setMinimumSize(800, 600)
        self.setStyleSheet("background-color: #2c2c2c; color: white;")

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)

        content = QWidget()
        self.grid = QGridLayout()
        self.grid.setSpacing(16)
        content.setLayout(self.grid)
        scroll.setWidget(content)

        self.setCentralWidget(scroll)

        self.load_and_suggest(json_path)

    def load_and_suggest(self, json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            meals = json.load(f)

        suggested = select_suggested_meals(meals)

        for i, meal in enumerate(suggested):
            card = MealCard(meal)
            row, col = divmod(i, 2)  # Display 2 per row
            self.grid.addWidget(card, row, col)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
