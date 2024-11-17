from dataclasses import dataclass
from .base import ArtistSearchResult, BaseProvider
from ..settings import DiscogsSettings


@dataclass
class DiscogsProvider(BaseProvider):
    settings: DiscogsSettings
    pass

    def search_artist(self) -> ArtistSearchResult | None:
        pass
    def get_musicbrainz_relation_key(self) -> str | None:
        return "discogs"