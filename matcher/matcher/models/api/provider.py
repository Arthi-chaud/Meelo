from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin, dataclass_json, LetterCase
from typing import Optional


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class Provider(DataClassJsonMixin):
    id: int
    name: str
    slug: str
    illustration_id: Optional[int]
