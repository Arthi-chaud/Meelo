from dataclasses import dataclass
from .base import ArtistSearchResult, BaseProvider
from ..settings import WikipediaSettings


@dataclass
class WikipediaProvider(BaseProvider):
    settings: WikipediaSettings
    pass

    def search_artist(self) -> ArtistSearchResult | None:
        pass
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return None