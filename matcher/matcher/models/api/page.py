from dataclasses import dataclass
from typing import Generic, TypeVar

from dataclasses_json import dataclass_json

T = TypeVar("T")


@dataclass_json
@dataclass
class Page(Generic[T]):
    items: list[T]
