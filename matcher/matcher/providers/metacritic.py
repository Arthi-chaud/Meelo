from dataclasses import dataclass
from typing import Any
from matcher.settings import MetacriticSettings
from .base import ArtistSearchResult, BaseProvider


@dataclass
class MetacriticProvider(BaseProvider):
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