from dataclasses import dataclass
from dataclasses_json import (
    dataclass_json,
    LetterCase,
    Undefined,
    DataClassJsonMixin,
)
from typing import Optional


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Album(DataClassJsonMixin):
    name: str
    artist_name: Optional[str] = None
    release_date: Optional[str] = None
