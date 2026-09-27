import sys
import json
from datetime import datetime, timedelta
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QLineEdit, QListWidget,
    QPushButton, QDateEdit, QHBoxLayout, QMessageBox, QListWidgetItem
)
from PySide6.QtCore import Qt, QDate
from db import get_last_meal_entries, insert_meal, get_last_date, delete_meal_entry


class BackfillApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Meal DB Backfill")
        self.setMinimumSize(600, 400)
        self.setStyleSheet("background-color: #2c2c2c; color: white;")

        self.load_meals()
        self.setup_ui()
        self.refresh_recent()

    def load_meals(self):
        with open("meals.json", "r", encoding="utf-8") as f:
            self.meals = json.load(f)
        self.meal_names = [m["name"] for m in self.meals]

    def setup_ui(self):
        layout = QVBoxLayout()

        self.search = QLineEdit()
        self.search.setPlaceholderText("Search for a meal...")
        self.search.textChanged.connect(self.on_search)
        layout.addWidget(self.search)

        self.result_list = QListWidget()
        self.result_list.addItems(self.meal_names)
        layout.addWidget(self.result_list)

        date_controls = QHBoxLayout()
        self.date_picker = QDateEdit()
        self.date_picker.setCalendarPopup(True)
        self.date_picker.setDate(QDate.currentDate())
        date_controls.addWidget(QLabel("Date made:"))
        date_controls.addWidget(self.date_picker)

        self.add_next_button = QPushButton("Add for Next Day After Last")
        self.add_next_button.clicked.connect(self.use_next_day)
        date_controls.addWidget(self.add_next_button)

        layout.addLayout(date_controls)

        self.add_button = QPushButton("Add Meal to DB")
        self.add_button.clicked.connect(self.add_meal)
        layout.addWidget(self.add_button)

        self.recent_label = QLabel("Last 3 Meals in DB:")
        layout.addWidget(self.recent_label)

        self.recent_list = QListWidget()
        self.recent_list.itemClicked.connect(self.confirm_delete)
        layout.addWidget(self.recent_list)

        self.setLayout(layout)

    def on_search(self, text):
        self.result_list.clear()
        matches = [m for m in self.meal_names if text.lower() in m.lower()]
        self.result_list.addItems(matches)

    def use_next_day(self):
        last_date = get_last_date()
        if last_date:
            last_date_dt = datetime.strptime(last_date, "%Y-%m-%d")
            next_day = last_date_dt + timedelta(days=1)
        else:
            next_day = datetime.today()
        self.date_picker.setDate(QDate(next_day.year, next_day.month, next_day.day))

    def add_meal(self):
        selected_items = self.result_list.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, "Error", "Please select a meal.")
            return

        meal_name = selected_items[0].text()
        week_start = self.date_picker.date().toPython().isoformat()
        insert_meal(meal_name, week_start)
        self.refresh_recent()

    def confirm_delete(self, item: QListWidgetItem):
        text = item.text()
        if ":" not in text:
            return
        week_start, meal_name = text.split(": ", 1)
        confirm = QMessageBox.question(
            self,
            "Delete Entry",
            f"Delete '{meal_name}' from {week_start}?",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            delete_meal_entry(meal_name, week_start)
            self.refresh_recent()

    def refresh_recent(self):
        self.recent_list.clear()
        recent = get_last_meal_entries()
        for meal_name, week_start in recent:
            self.recent_list.addItem(f"{week_start}: {meal_name}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BackfillApp()
    window.show()
    sys.exit(app.exec())
