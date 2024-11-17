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