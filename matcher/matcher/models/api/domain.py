from dataclasses import dataclass
from dataclasses_json import (
    dataclass_json,
    LetterCase,
    Undefined,
    DataClassJsonMixin,
)
from typing import Optional, List
from matcher.providers.domain import AlbumType


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Artist(DataClassJsonMixin):
    id: int
    name: str


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Album(DataClassJsonMixin):
    id: int
    name: str
    artist: Optional[Artist] = None
    type: AlbumType = AlbumType.OTHER
    release_date: Optional[str] = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Track(DataClassJsonMixin):
    source_file_id: int
    duration: Optional[int] = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Song(DataClassJsonMixin):
    id: int
    name: str
    artist: Artist
    featuring: List[Artist]
    master: Optional[Track] = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class File(DataClassJsonMixin):
    fingerprint: Optional[str] = None
