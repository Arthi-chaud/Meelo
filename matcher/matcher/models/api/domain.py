from dataclasses import dataclass
from dataclasses_json import (
    dataclass_json,
    LetterCase,
    Undefined,
    DataClassJsonMixin,
)
from typing import Optional
from matcher.providers.domain import AlbumType



@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Album(DataClassJsonMixin):
    name: str
    type: AlbumType = AlbumType.OTHER 
    artist_name: Optional[str] = None
    release_date: Optional[str] = None

