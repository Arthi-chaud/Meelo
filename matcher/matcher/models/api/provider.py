from dataclasses import dataclass

from dataclasses_json import DataClassJsonMixin, LetterCase, dataclass_json


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class Provider(DataClassJsonMixin):
    id: int
    name: str
    slug: str
    illustration_id: int | None
