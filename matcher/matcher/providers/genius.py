from dataclasses import dataclass
from typing import Any

import requests
from .base import ArtistSearchResult, BaseProvider
from ..settings import GeniusSettings
from urllib.parse import urlparse


# Consider that the passed Ids are names, not the numeric ids
@dataclass
class GeniusProvider(BaseProvider):
    settings: GeniusSettings
    pass

    def _fetch(self, url: str, params={}, host="https://genius.com/api"):
        return requests.get(
            f"{host}{url}",
            params=params
                if host == "https://genius.com/api"
                else {**params, "access_token": self.settings.api_key},
            headers={
                "Authorization": f"{self.settings.api_key}",
                "User-Agent": "Meelo (Matcher), v0.0.1",
            },
        ).json()

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        try:
            artists = self._fetch("/search/artist", {"q": artist_name})["response"][
                "sections"
            ][0]["hits"]
            for artist in artists:
                # TODO Use slug
                if artist["result"]["name"] == artist_name:
                    return ArtistSearchResult(artist["result"]["name"])
            return None
        except Exception:
            return None

    def get_musicbrainz_relation_key(self) -> str | None:
        return "genius"

    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        return (
            rel["type"] == "lyrics" and urlparse(rel["target"]).netloc == "genius.com"
        )

    def get_artist_id_from_url(self, artist_url: str) -> str | None:
        id = artist_url.replace("https://genius.com/artists/", "")
        return id

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://genius.com/artists/{artist_id}"

    def get_artist(self, artist_id: str) -> Any | None:
        try:
            artists = self._fetch("/search/artist", {"q": artist_id})["response"][
                "sections"
            ][0]["hits"]
            for artist in artists:
                artist = artist["result"]
                if not artist["_type"] == "artist":
                    continue
                if artist["url"] == self.get_artist_url_from_id(artist_id):
                    return artist
            return None
        except Exception:
            return None

    def get_artist_description(self, artist, artist_url: str) -> str | None:
        try:
            artist = self._fetch(artist["api_path"], {'text_format': 'plain'}, "https://api.genius.com")[
                "response"
            ]['artist']
            return artist["description"]["plain"]
        except Exception:
            return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        try:
            return artist["image_url"]
        except Exception:
            return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P2373"
