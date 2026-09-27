from dataclasses import dataclass, field
from typing import List, Optional
import hashlib


@dataclass
class Meal:
    name: str
    ethnicity: str = ""
    difficulty: str = "easy"
    image: Optional[str] = None
    disliked_by: List[str] = field(default_factory=list)
    locked: bool = False
    id: int = field(init=False)  # This will be set in __post_init__

    def __post_init__(self):
        # Create a reproducible hash ID based on meal name
        self.id = int(hashlib.md5(self.name.encode()).hexdigest()[:8], 16)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "ethnicity": self.ethnicity,
            "difficulty": self.difficulty,
            "image": self.image,
            "disliked_by": self.disliked_by,
            "locked": self.locked,
            "id": self.id,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Meal':
        return cls(
            name=data.get("name", "Unnamed"),
            ethnicity=data.get("ethnicity", ""),
            difficulty=data.get("difficulty", "easy"),
            image=data.get("image"),
            disliked_by=data.get("disliked_by", []),
            locked=data.get("locked", False)
        )
