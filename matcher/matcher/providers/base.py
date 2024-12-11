from abc import abstractmethod
from typing import Any, TypeVar, Type, TypeVarTuple, Callable

from matcher.settings import BaseProviderSettings
from .domain import AlbumSearchResult, ArtistSearchResult
from ..models.api.provider import Provider as ApiProviderEntry
from typing import List
from dataclasses import dataclass, field
from datetime import date

Settings = TypeVar("Settings", bound=BaseProviderSettings, default=BaseProviderSettings)


@dataclass
class BaseFeature[*Args, Res]:
    Args = TypeVarTuple("Args")
    Res = TypeVar("Res")

    run: Callable[["BaseProvider", *Args], Res]


@dataclass
class BaseProvider[Settings]:
    T = TypeVar("T")
    api_model: ApiProviderEntry
    settings: Settings
    features: List[BaseFeature] = field(init=False)

    def has_feature(self, t: Type[T]) -> bool:
        return any([f for f in self.features if isinstance(f, t)])

    def get_feature(self, t: Type[T]) -> T | None:
        try:
            return [f for f in self.features if isinstance(f, t)][0]
        except Exception:
            pass

    @abstractmethod
    def get_musicbrainz_relation_key(self) -> str | None:
        pass

    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        pass

    # Artist
    @abstractmethod
    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass

    @abstractmethod
    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        pass

    @abstractmethod
    def get_artist_id_from_url(self, artist_url) -> str | None:
        pass

    @abstractmethod
    def get_artist(self, artist_id: str) -> Any | None:
        pass

    @abstractmethod
    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        pass

    @abstractmethod
    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        pass

    @abstractmethod
    def get_wikidata_artist_relation_key(self) -> str | None:
        pass

    # Album
    @abstractmethod
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        pass

    @abstractmethod
    def get_album_url_from_id(self, album_id: str) -> str | None:
        pass

    @abstractmethod
    def get_album_id_from_url(self, album_url) -> str | None:
        pass

    @abstractmethod
    def get_album(self, album_id: str) -> Any | None:
        pass

    @abstractmethod
    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass

    @abstractmethod
    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        pass

    @abstractmethod
    def get_album_genres(self, album: Any, album_url: str) -> List[str] | None:
        pass

    @abstractmethod
    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        pass

    @abstractmethod
    def get_wikidata_album_relation_key(self) -> str | None:
        pass
