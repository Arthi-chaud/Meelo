from abc import abstractmethod
from typing import Any, Protocol
from ..models.api.provider import Provider as ApiProviderEntry
from dataclasses import dataclass

@dataclass
class ArtistSearchResult:
    id: str

@dataclass
class BaseProvider(Protocol):
    api_model: ApiProviderEntry
    
    @abstractmethod
    def get_musicbrainz_relation_key(self) -> str | None:
        pass

    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        pass

    @abstractmethod
    def search_artist(self) -> ArtistSearchResult | None:
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