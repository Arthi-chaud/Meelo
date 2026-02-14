import jsons
import json
from dataclasses import dataclass


@dataclass
class Event:
    type: str
    name: str
    id: int

    @staticmethod
    def from_json(raw_json: bytes):
        return jsons.load(json.loads(raw_json)["data"], Event)
