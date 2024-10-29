from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin, dataclass_json, LetterCase
from typing import Optional


@dataclass
@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
class Provider(DataClassJsonMixin):
    id: int
    name: str
    slug: str
    illustration_id: Optional[str]
