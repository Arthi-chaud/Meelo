from dataclasses import dataclass

from dataclasses_json import DataClassJsonMixin, LetterCase, Undefined, dataclass_json

from matcher.providers.domain import AreaType


@dataclass_json
@dataclass
class LabelDto(DataClassJsonMixin):
    name: str
    mbid: str | None = None


@dataclass_json
@dataclass
class SeriesDto(DataClassJsonMixin):
    name: str
    mbid: str | None = None
    index: float | None = None


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateAlbumDto(DataClassJsonMixin):
    # str should be iso 8601
    release_date: str | None = None
    genres: list[str] | None = None
    labels: list[LabelDto] | None = None
    series: SeriesDto | None = None
    type: str | None = None


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class AreaDto(DataClassJsonMixin):
    name: str
    sort_name: str
    mbid: str
    iso3166: str | None = None
    type: AreaType | None = None


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateAreaDto(DataClassJsonMixin):
    parentId: int | None = None
    type: AreaType | None = None


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
    sources: list[ExternalMetadataSourceDto]
    song_id: int | None = None
    artist_id: int | None = None
    album_id: int | None = None

    def push_source(self, source: ExternalMetadataSourceDto):
        self.sources.append(source)

    def set_rating_if_none(self, rating: int):
        self.rating = self.rating or rating

    def set_description_if_none(self, description: str):
        self.description = self.description or description


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateLabelDto(DataClassJsonMixin):
    start_date: str | None = None
    end_date: str | None = None
    mbid: str | None = None
    area_id: int | None = None


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class UpdateSeriesDto(DataClassJsonMixin):
    mbid: str | None = None
