from dataclasses import dataclass
from dataclasses_json import dataclass_json
from typing import List, TypeVar, Generic

T = TypeVar("T")


@dataclass_json
@dataclass
class Page(Generic[T]):
    items: List[T]
