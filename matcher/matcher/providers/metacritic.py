from dataclasses import dataclass
from typing import Any
from matcher.settings import MetacriticSettings
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..models.api.provider import Provider as ApiProviderEntry
from datetime import date


@dataclass
class MetacriticProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: MetacriticSettings
    pass

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass

    def get_musicbrainz_relation_key(self) -> str | None:
        return None

    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://www.metacritic.com/person/{artist_id.removeprefix('person/')}"

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P1712"

    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        pass

    def get_album_url_from_id(self, album_id: str) -> str | None:
        pass

    def get_album_id_from_url(self, album_url) -> str | None:
        pass

    def get_album(self, album_id: str) -> Any | None:
        pass

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P1712"

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        pass
