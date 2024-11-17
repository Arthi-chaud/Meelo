from dataclasses import dataclass
from typing import Any
from .base import ArtistSearchResult, BaseProvider
from ..settings import GeniusSettings
from urllib.parse import urlparse


@dataclass
class GeniusProvider(BaseProvider):
    settings: GeniusSettings
    pass

    def search_artist(self) -> ArtistSearchResult | None:
        pass
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return "genius"
    
    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        return rel['type'] == 'lyrics' and urlparse(rel['target']).netloc == "genius.com"
    
    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None