from dataclasses import dataclass
import logging
from typing import Any
import requests
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..settings import GeniusSettings
from urllib.parse import urlparse
from ..models.api.provider import Provider as ApiProviderEntry
from datetime import date


# Consider that the passed Ids are names, not the numeric ids
@dataclass
class GeniusProvider(BaseProvider):
    api_model: ApiProviderEntry
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
            artist_slug = self._slugify(artist_name)
            for artist in artists:
                if self._slugify(artist["result"]["name"]) == artist_slug:
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
            artist = self._fetch(
                artist["api_path"], {"text_format": "plain"}, "https://api.genius.com"
            )["response"]["artist"]
            desc = artist["description"]["plain"]
            if desc == "?":
                return None
            return desc
        except Exception:
            return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        try:
            imageUrl = artist["image_url"]
            if "default_avatar" in imageUrl:
                return None
            return imageUrl
        except Exception:
            return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P2373"

    # TODO Use a real slug
    def _slugify(self, s: str) -> str:
        return "".join(s.lower().split())

    # Album
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        artist_slug = None if not artist_name else self._slugify(artist_name)
        album_slug = self._slugify(album_name)
        try:
            albums = self._fetch(
                "/search/album", {"q": f"{album_name} {artist_name or ""}"}
            )["response"]["sections"][0]["hits"]
            for album in albums:
                album = album["result"]
                if (
                    artist_slug
                    and self._slugify(album["artist"]["name"]) != artist_slug
                ):
                    continue
                if self._slugify(album["name"]) == album_slug:
                    album_url = album["url"]
                    return AlbumSearchResult(str(self.get_album_id_from_url(album_url)))
            return None
        except Exception:
            return None

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://genius.com/albums/{album_id}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://genius.com/albums/", "")

    def get_album(self, album_id: str) -> Any | None:
        try:
            artists = self._fetch("/search/album", {"q": album_id})["response"][
                "sections"
            ][0]["hits"]
            for artist in artists:
                artist = artist["result"]
                if not artist["_type"] == "album":
                    continue
                if artist["url"] == self.get_album_url_from_id(album_id):
                    return artist
            return None
        except Exception:
            return None

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        try:
            album_release_date = album["release_date_components"]
            return date(
                album_release_date["year"],
                album_release_date["month"],
                album_release_date["day"],
            )
        except Exception:
            pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P6217"
