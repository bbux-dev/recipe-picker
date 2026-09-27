from PySide6.QtCore import Signal, Qt
from PySide6.QtWidgets import QMainWindow, QPushButton, QScrollArea, QGridLayout
from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QCheckBox


class MealCardView(QWidget):
    lock_toggled = Signal(int, bool)

    def __init__(self, meal):
        super().__init__()
        self.meal = meal
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout()
        self.name_label = QLabel(self.meal.name)
        self.lock_checkbox = QCheckBox("Lock")
        self.lock_checkbox.setChecked(self.meal.locked)
        self.lock_checkbox.stateChanged.connect(self.emit_lock)
        layout.addWidget(self.name_label)
        layout.addWidget(self.lock_checkbox)
        self.setLayout(layout)

    def emit_lock(self, state):
        self.lock_toggled.emit(self.meal.id, state == Qt.Checked)

    def update(self, meal):
        self.meal = meal
        self.name_label.setText(meal.name)
        self.lock_checkbox.setChecked(meal.locked)


class MainWindow(QMainWindow):
    def __init__(self, controller, suggest_function):
        super().__init__()
        self.setWindowTitle("Weekly Meal Suggestions")
        self.setMinimumSize(800, 600)
        self.setStyleSheet("background-color: #2c2c2c; color: white;")
        self.slots = [None] * 4  # fixed 4 slots, can expand if needed
        self.locked = []
        self.controller = controller
        self.suggest_function = suggest_function

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
        meals = self.controller.load_meals()

        # Identify locked meals and empty slots
        empty_indices = [i for i, m in enumerate(self.slots) if m not in self.locked]

        available_meals = [m for m in meals if m not in self.locked]
        new_suggestions = self.suggest_function(available_meals, count=len(empty_indices))

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
