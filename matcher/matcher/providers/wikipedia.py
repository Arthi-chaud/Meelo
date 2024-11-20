from dataclasses import dataclass
from typing import Any
from .base import ArtistSearchResult, BaseProvider
from ..settings import WikipediaSettings


@dataclass
class WikipediaProvider(BaseProvider):
    settings: WikipediaSettings
    pass

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return None
    
    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None
    
    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return None

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        pass