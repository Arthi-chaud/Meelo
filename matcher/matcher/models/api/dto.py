from dataclasses import dataclass
from typing import List, Optional
from dataclasses_json import DataClassJsonMixin, LetterCase, Undefined, dataclass_json


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateAlbumDto(DataClassJsonMixin):
    # str should be iso 8601
    release_date: Optional[str] = None
    genres: Optional[List[str]] = None
    labels: Optional[List[str]] = None
    type: Optional[str] = None


@dataclass_json
@dataclass
class User(DataClassJsonMixin):
    id: int
    name: str
    admin: bool
    enabled: bool


@dataclass_json
@dataclass
class CreateProviderDto(DataClassJsonMixin):
    name: str


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class ExternalMetadataSourceDto(DataClassJsonMixin):
    url: str
    provider_id: int


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.EXCLUDE)  # type: ignore
@dataclass
class ExternalMetadataDto(DataClassJsonMixin):
    description: str | None
    rating: int | None
    sources: List[ExternalMetadataSourceDto]
    song_id: Optional[int] = None
    artist_id: Optional[int] = None
    album_id: Optional[int] = None

    def push_source(self, source: ExternalMetadataSourceDto):
        self.sources.append(source)

    def set_rating_if_none(self, rating: int):
        self.rating = self.rating or rating

    def set_description_if_none(self, description: str):
        self.description = self.description or description
