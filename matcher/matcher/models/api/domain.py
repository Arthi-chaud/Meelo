from dataclasses import dataclass

from dataclasses_json import (
    DataClassJsonMixin,
    LetterCase,
    Undefined,
    dataclass_json,
)

from matcher.providers.domain import AlbumType, AreaType


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Series(DataClassJsonMixin):
    id: int
    name: str
    mbid: str | None = None
    index: float | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class LocalIdentifiers(DataClassJsonMixin):
    musicbrainz_id: str | None = None
    discogs_id: str | None = None
    acoustid_id: str | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Artist(DataClassJsonMixin):
    id: int
    name: str
    local_identifiers: LocalIdentifiers | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Album(DataClassJsonMixin):
    id: int
    name: str
    artists: list[Artist] | None = None
    series: Series | None = None
    type: AlbumType = AlbumType.OTHER
    release_date: str | None = None
    local_identifiers: LocalIdentifiers | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Label(DataClassJsonMixin):
    id: int
    name: str
    mbid: str | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Area(DataClassJsonMixin):
    id: int
    name: str
    mbid: str
    type: AreaType | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Track(DataClassJsonMixin):
    source_file_id: int
    duration: int | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class Song(DataClassJsonMixin):
    id: int
    name: str
    artist: Artist
    featuring: list[Artist]
    master: Track | None = None
    local_identifiers: LocalIdentifiers | None = None


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class File(DataClassJsonMixin):
    fingerprint: str | None = None
