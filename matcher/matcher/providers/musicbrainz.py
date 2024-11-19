from dataclasses import dataclass
import logging
from typing import Any, List
from .base import ArtistSearchResult, BaseProvider
from ..settings import MusicBrainzSettings
import musicbrainzngs

@dataclass
class MusicBrainzProvider(BaseProvider):
    settings: MusicBrainzSettings
    pass

    def set_user_agent(self):
        musicbrainzngs.set_useragent("Meelo Matcher", "0.0.1", "github.com/Arthi-chaud/Meelo")

    def get_artist(self, artist_id: str) -> Any:
        self.set_user_agent()
        return musicbrainzngs.get_artist_by_id(artist_id, ['url-rels'])

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        self.set_user_agent()
        matches = musicbrainzngs.search_artists(artist_name, limit=3)['artist-list']
        return ArtistSearchResult(matches[0]['id']) if len(matches) > 0 else None

    def get_musicbrainz_relation_key(self) -> str | None:
        return None
    
    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None
    
    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://musicbrainz.org/artist/{artist_id}"

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None