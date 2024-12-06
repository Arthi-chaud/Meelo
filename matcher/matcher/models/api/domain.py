from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase, DataClassJsonMixin


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class Album(DataClassJsonMixin):
    name: str
    artist_name: str | None
    release_date: str | None
