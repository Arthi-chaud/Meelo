from dataclasses import dataclass
from matcher.settings import MetacriticSettings
from .base import ArtistSearchResult, BaseProvider


@dataclass
class MetacriticProvider(BaseProvider):
    settings: MetacriticSettings
    pass
    def search_artist(self) -> ArtistSearchResult | None:
        pass
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return None