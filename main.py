import sys
import os
import json
import random
from PySide6.QtWidgets import (
    QApplication, QLabel, QVBoxLayout, QWidget,
    QGridLayout, QScrollArea, QMainWindow, QPushButton, QCheckBox
)
from PySide6.QtGui import QPixmap
from PySide6.QtCore import Qt


class MealCard(QWidget):
    def __init__(self, meal, locked_handler, slot_index, is_locked=False):
        super().__init__()
        self.meal = meal  # Store the meal data
        self.slot_index = slot_index
        self.locked = is_locked  # Default state
        self.locked_handler = locked_handler

        layout = QVBoxLayout()

        # Load image
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

        # Lock checkbox
        self.lock_checkbox = QCheckBox("Lock")
        self.lock_checkbox.setStyleSheet("color: lightgray;")
        self.lock_checkbox.setChecked(False)
        self.lock_checkbox.stateChanged.connect(self.update_lock_state)

        layout.addWidget(img_label)
        layout.addWidget(name_label)
        layout.addWidget(ethnicity_label)
        layout.addWidget(self.lock_checkbox)

        self.setLayout(layout)

    def is_locked(self):
        return self.locked

    def get_meal(self):
        return self.meal

    def update_lock_state(self, state):
        self.locked = state == Qt.Checked.value
        self.locked_handler(self.meal, self.locked, self.slot_index)


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


class MainWindow(QMainWindow):
    def __init__(self, json_path="meals.json"):
        super().__init__()
        self.setWindowTitle("Weekly Meal Suggestions")
        self.setMinimumSize(800, 600)
        self.setStyleSheet("background-color: #2c2c2c; color: white;")
        self.json_path = json_path
        self.slots = [None] * 4  # fixed 4 slots, can expand if needed
        self.locked = []

        # Main container layout
        main_layout = QVBoxLayout()

        # Add Refresh Button
        refresh_button = QPushButton("🔄 Refresh Suggestions")
        refresh_button.setStyleSheet("background-color: #444; color: white; padding: 8px; font-weight: bold;")
        refresh_button.clicked.connect(self.refresh_suggestions)
        main_layout.addWidget(refresh_button)

        # Scroll Area
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)

        # Content widget and grid layout
        self.content = QWidget()
        self.grid = QGridLayout()
        self.grid.setSpacing(16)
        self.content.setLayout(self.grid)
        self.scroll.setWidget(self.content)

        main_layout.addWidget(self.scroll)

        # Wrap the full layout in a central widget
        container = QWidget()
        container.setLayout(main_layout)
        self.setCentralWidget(container)

        # Initial load
        self.load_and_suggest()

    def handle_lock_checked(self, meal, is_checked, slot_index):
        if is_checked:
            self.locked.append(meal)
        else:
            self.locked.remove(meal)

    def load_and_suggest(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            meals = json.load(f)

        # Identify locked meals and empty slots
        empty_indices = [i for i, m in enumerate(self.slots) if m not in self.locked]

        available_meals = [m for m in meals if m not in self.locked]
        new_suggestions = select_suggested_meals(available_meals, count=len(empty_indices))

        # Fill empty slots with new suggestions
        for idx, meal in zip(empty_indices, new_suggestions):
            self.slots[idx] = meal

        # Clear grid
        while self.grid.count():
            item = self.grid.takeAt(0)
            widget = item.widget()
            if widget is not None:
                widget.deleteLater()

        # Re-render based on self.slots
        for i, meal in enumerate(self.slots):
            card = MealCard(meal, locked_handler=self.handle_lock_checked, slot_index=i, is_locked=meal in self.locked)
            card.lock_checkbox.setChecked(meal in self.locked)
            row, col = divmod(i, 2)
            self.grid.addWidget(card, row, col)

    def refresh_suggestions(self):
        # Clear the grid layout
        while self.grid.count():
            item = self.grid.takeAt(0)
            widget = item.widget()
            if widget is not None:
                widget.deleteLater()

        # Reload suggestions
        self.load_and_suggest()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
