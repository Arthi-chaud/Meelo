from dataclasses import dataclass
import logging
from typing import Any
from .base import ArtistSearchResult, BaseProvider
from ..settings import GeniusSettings
from urllib.parse import urlparse
from lyricsgenius import Genius

@dataclass
class GeniusProvider(BaseProvider):
    settings: GeniusSettings
    pass

    def _get_client(self):
        return Genius(self.settings.api_key)

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        client = self._get_client()
        try:
            artists = client.search(artist_name, type_='artist')['sections'][0]['hits']
            for artist in artists:
                # TODO Use slug 
                if artist['result']['name'] == artist_name:
                    return ArtistSearchResult(artist['result']['name'])
            return None
        except:
            return None
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return "genius"
    
    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        return rel['type'] == 'lyrics' and urlparse(rel['target']).netloc == "genius.com"
    
    def get_artist_id_from_url(self, artist_url: str) -> str | None:
        id = artist_url.replace("https://genius.com/artists/", "")
        return id if id.isnumeric() else None

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://genius.com/artists/{artist_id}"

    def get_artist(self, artist_id: str) -> Any | None:
        client = self._get_client()
        try:
            if not artist_id.isnumeric():
                return client.search_artist(artist_id, allow_name_change=False)
            artist = client.search_artist(artist_id, artist_id=artist_id)
            return artist
        except Exception as e:
            logging.error(e)
            return None

    def get_artist_description(self, artist, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P2373"