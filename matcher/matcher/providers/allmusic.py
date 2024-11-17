from dataclasses import dataclass
from typing import Any
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

    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None