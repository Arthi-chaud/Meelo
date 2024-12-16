from dataclasses import dataclass
from typing import Any
import requests

from matcher.providers.features import (
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistDescriptionFeature,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistIllustrationUrlFeature,
    GetArtistUrlFromIdFeature,
    GetMusicBrainzRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataSongRelationKeyFeature,
    IsMusicBrainzRelationFeature,
    SearchAlbumFeature,
    SearchArtistFeature,
)
from .domain import ArtistSearchResult, AlbumSearchResult
from .boilerplate import BaseProviderBoilerplate
from ..settings import GeniusSettings
from urllib.parse import urlparse
from datetime import date
from ..utils import to_slug


# Consider that the passed Ids are names, not the numeric ids
@dataclass
class GeniusProvider(BaseProviderBoilerplate[GeniusSettings]):
    def __post_init__(self):
        self.features = [
            GetMusicBrainzRelationKeyFeature(lambda: "genius"),
            IsMusicBrainzRelationFeature(
                lambda rel: rel["type"] == "lyrics"
                and urlparse(rel["url"]["resource"]).netloc == "genius.com"
            ),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetArtistIdFromUrlFeature(
                lambda artist_url: artist_url.replace("https://genius.com/artists/", "")
            ),
            GetArtistUrlFromIdFeature(
                lambda artist_id: f"https://genius.com/artists/{artist_id}"
            ),
            GetArtistFeature(lambda artist_id: self._get_artist(artist_id)),
            GetArtistDescriptionFeature(
                lambda artist: self._get_artist_description(artist)
            ),
            GetArtistIllustrationUrlFeature(
                lambda artist: self._get_artist_illustration_url(artist)
            ),
            GetWikidataArtistRelationKeyFeature(lambda: "P2373"),
            SearchAlbumFeature(
                lambda album_name, artist_name: self._search_album(
                    album_name, artist_name
                )
            ),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://genius.com/albums/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: album_url.replace("https://genius.com/albums/", "")
            ),
            GetAlbumFeature(lambda album: self._get_album(album)),
            GetAlbumReleaseDateFeature(
                lambda album: self._get_album_release_date(album)
            ),
            GetWikidataAlbumRelationKeyFeature(lambda: "P6217"),
            GetWikidataSongRelationKeyFeature(lambda: "P6218"),
        ]

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

    def _search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        try:
            artist_name = artist_name.lower()
            artists = self._fetch("/search/artist", {"q": artist_name})["response"][
                "sections"
            ][0]["hits"]
            # Sometimes search fails if the name contains ' and ' instead of ' & '
            if len(artists) == 0 and " and " in artist_name:
                artists = self._fetch(
                    "/search/artist", {"q": artist_name.replace(" and ", " & ")}
                )["response"]["sections"][0]["hits"]
            artist_slug = to_slug(
                artist_name.replace(" & ", " and ").replace(" and ", " ")
            )
            for artist in artists:
                if (
                    to_slug(
                        artist["result"]["name"]
                        .lower()
                        .replace(" & ", " and ")
                        .replace(" and ", " ")
                    )
                    == artist_slug
                ):
                    return ArtistSearchResult(artist["result"]["name"])
            return None
        except Exception:
            return None

    def _get_artist(self, artist_id: str) -> Any | None:
        try:
            artists = self._fetch("/search/artist", {"q": artist_id})["response"][
                "sections"
            ][0]["hits"]
            for artist in artists:
                artist = artist["result"]
                if not artist["_type"] == "artist":
                    continue
                if (
                    to_slug(artist["name"]) == to_slug(artist_id)
                    or str(artist["id"]) == artist_id
                ):
                    return artist
            return None
        except Exception:
            return None

    def _get_artist_description(self, artist) -> str | None:
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

    def _get_artist_illustration_url(self, artist: Any) -> str | None:
        try:
            imageUrl = artist["image_url"]
            if "default_avatar" in imageUrl:
                return None
            return imageUrl
        except Exception:
            return None

    # Album
    def _search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        artist_slug = None if not artist_name else to_slug(artist_name)
        album_slug = to_slug(album_name)
        try:
            albums = self._fetch(
                "/search/album", {"q": f"{album_name} {artist_name or str()}"}
            )["response"]["sections"][0]["hits"]
            for album in albums:
                album = album["result"]
                if artist_slug and to_slug(album["artist"]["name"]) != artist_slug:
                    continue
                if to_slug(album["name"]) == album_slug:
                    album_url = album["url"]
                    return AlbumSearchResult(str(self.get_album_id_from_url(album_url)))
            return None
        except Exception:
            return None

    def _get_album(self, album_id: str) -> Any | None:
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

    def _get_album_release_date(self, album: Any) -> date | None:
        try:
            album_release_date = album["release_date_components"]
            return date(
                album_release_date["year"],
                album_release_date["month"],
                album_release_date["day"],
            )
        except Exception:
            pass
