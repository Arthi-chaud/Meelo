from dataclasses import dataclass
from typing import Any, List

from matcher.utils import capitalize_all_words
import discogs_client.client
import requests
from .domain import ArtistSearchResult, AlbumSearchResult
from .boilerplate import BaseProviderBoilerplate
from ..settings import DiscogsSettings
from datetime import date
import discogs_client


@dataclass
class DiscogsProvider(BaseProviderBoilerplate[DiscogsSettings]):
    def _headers(self):
        return {
            "Accept-Encoding": "gzip",
            "Accept": "application/vnd.discogs.v2.plaintext+json",
            "User-Agent": "Meelo Matcher/0.0.1",
        }

    def _get_client(self):
        return discogs_client.Client(
            "Meelo Matcher/0.0.1", user_token=self.settings.api_key
        )

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        client = self._get_client()
        try:
            return ArtistSearchResult(
                str(client.search(artist_name, type="artist")[0].id)
            )
        except Exception:
            return None

    def get_musicbrainz_relation_key(self) -> str | None:
        return "discogs"

    def get_artist_id_from_url(self, artist_url) -> str | None:
        return artist_url.replace("https://www.discogs.com/artist/", "")

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return "https://www.discogs.com/artist/" + str(artist_id)

    def get_artist(self, artist_id: str) -> Any | None:
        try:
            return requests.get(
                f"https://api.discogs.com/artists/{artist_id}",
                headers=self._headers(),
                params={"token": self.settings.api_key},
            ).json()
        except Exception:
            return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        try:
            return artist["profile_plaintext"]
        except Exception:
            return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        try:
            return artist["images"][0]["uri"]
        except Exception:
            return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P1953"

    # Album
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        # Unimplemented because need to identify singles from albums
        # Too lazy, and anyway we propably dont need info from that provider
        pass

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://www.discogs.com/master/{album_id}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://www.discogs.com/master/", "")

    def get_album(self, album_id: str) -> Any | None:
        try:
            return requests.get(
                f"https://api.discogs.com/masters/{album_id}",
                headers=self._headers(),
                params={"token": self.settings.api_key},
            ).json()
        except Exception:
            return None

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        # Description from this provider aren't good
        pass

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        # It only provides a year, skip
        pass

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        pass

    def get_album_genres(self, album: Any, album_url: str) -> List[str] | None:
        try:
            return [capitalize_all_words(g) for g in album["genres"]]
        except Exception:
            pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P1954"
