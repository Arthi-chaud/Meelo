from dataclasses import dataclass
import logging
from typing import Any

import discogs_client.client
from .base import ArtistSearchResult, BaseProvider
from ..settings import DiscogsSettings
import discogs_client

@dataclass
class DiscogsProvider(BaseProvider):
    settings: DiscogsSettings
    pass

    def _get_client(self):
        return discogs_client.Client('Meelo Matcher/0.0.1', user_token=self.settings.api_key)

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        client = self._get_client()
        try:
            return ArtistSearchResult(client.search(artist_name, type='artist')[0].id)
        except:
            return None
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return "discogs"
    def get_artist_id_from_url(self, artist_url) -> str | None:
        return artist_url.replace('https://www.discogs.com/artist/', '')
   
    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return 'https://www.discogs.com/artist/' + str(artist_id)

    def get_artist(self, artist_id: str) -> Any | None:
        client = self._get_client()
        try:
            return client.artist(artist_id)
        except Exception as e:
            logging.error(e)
            return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        # Note the API does not return a plaintext description
        # too lazy to parse it.
        return None
        
    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        try:
            return artist.images[0]['uri']
        except:
            return None