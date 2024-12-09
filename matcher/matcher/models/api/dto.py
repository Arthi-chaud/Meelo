from dataclasses import dataclass
from typing import List
from dataclasses_json import DataClassJsonMixin, LetterCase, dataclass_json


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateAlbumDto(DataClassJsonMixin):
    # str should be iso 8601
    release_date: str


@dataclass_json
@dataclass
class CreateProviderDto(DataClassJsonMixin):
    name: str


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class ExternalMetadataSourceDto(DataClassJsonMixin):
    url: str
    provider_id: int


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class ExternalMetadataDto(DataClassJsonMixin):
    description: str | None
    rating: int | None
    song_id: int | None
    artist_id: int | None
    album_id: int | None
    sources: List[ExternalMetadataSourceDto]
