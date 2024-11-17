from dataclasses import dataclass
from .base import ArtistSearchResult, BaseProvider
from ..settings import AllMusicSettings


@dataclass
class AllMusicProvider(BaseProvider):
    settings: AllMusicSettings
    pass

    def get_musicbrainz_relation_key(self) -> str | None:
        return "allmusic"
    def search_artist(self) -> ArtistSearchResult | None:
        pass