from abc import abstractmethod
from typing import Any, Protocol
from ..models.api.provider import Provider as ApiProviderEntry
from dataclasses import dataclass
from datetime import date


@dataclass
class ArtistSearchResult:
    id: str


@dataclass
class AlbumSearchResult:
    id: str


@dataclass
class BaseProvider(Protocol):
    api_model: ApiProviderEntry

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
    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        pass

    @abstractmethod
    def get_wikidata_album_relation_key(self) -> str | None:
        pass
