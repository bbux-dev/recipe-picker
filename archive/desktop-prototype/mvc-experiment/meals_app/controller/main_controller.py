class MainController:
    def __init__(self, view, meal_plan):
        self.view = view
        self.model = meal_plan

        self.view.refresh_clicked.connect(self.handle_refresh)
        self.view.lock_toggled.connect(self.handle_lock_toggle)

        self.refresh_ui()

    def handle_refresh(self):
        self.model.refresh_meals()
        self.refresh_ui()

    def handle_lock_toggle(self, meal_id, is_locked):
        self.model.set_locked(meal_id, is_locked)
        self.refresh_ui()

    def refresh_ui(self):
        self.view.display_meals(self.model.get_current_slots())
