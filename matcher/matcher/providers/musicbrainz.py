from dataclasses import dataclass
import logging
import re
from typing import Any, List
import warnings

from matcher.providers.features import (
    GetAlbumGenresFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistUrlFromIdFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    SearchAlbumFeature,
    GetAlbumFeature,
    SearchArtistFeature,
)
from ..utils import capitalize_all_words, to_slug
from .domain import ArtistSearchResult, AlbumSearchResult
from ..settings import MusicBrainzSettings
from .boilerplate import BaseProviderBoilerplate
import musicbrainzngs
from musicbrainzngs.musicbrainz import _rate_limit
import requests
from datetime import date, datetime


@dataclass
class MusicBrainzProvider(BaseProviderBoilerplate[MusicBrainzSettings]):
    def __post_init__(self):
        # Ignore warning at runtime, the library uses XML and does not parse everything we want (like genres)
        logging.getLogger("musicbrainzngs").setLevel(logging.ERROR)
        with warnings.catch_warnings(action="ignore"):
            musicbrainzngs.set_format("json")
        musicbrainzngs.set_useragent(
            "Meelo Matcher", "0.0.1", "github.com/Arthi-chaud/Meelo"
        )
        self.features = [
            GetArtistFeature(
                lambda artist: musicbrainzngs.get_artist_by_id(artist, ["url-rels"])
            ),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetArtistUrlFromIdFeature(
                lambda artist_id: f"https://musicbrainz.org/artist/{artist_id}"
            ),
            GetArtistIdFromUrlFeature(
                lambda artist_url: artist_url.replace(
                    "https://musicbrainz.org/artist/", ""
                )
            ),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetWikidataArtistRelationKeyFeature(lambda: "P434"),
            GetWikidataAlbumRelationKeyFeature(lambda: "P436"),
            SearchAlbumFeature(
                lambda album_name, artist_name: self._search_album(
                    album_name, artist_name
                )
            ),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://musicbrainz.org/release-group/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: album_url.replace(
                    "https://musicbrainz.org/release-group/", ""
                )
            ),
            GetAlbumFeature(lambda album: self._get_album(album)),
            GetAlbumReleaseDateFeature(
                lambda album: self._get_album_release_date(album)
            ),
            GetAlbumGenresFeature(lambda album: self._get_album_genres(album)),
        ]

    # Note: Only use this method if action is not supported by library
    # E.g. Getting genres of a release-group
    @_rate_limit
    @staticmethod
    def _fetch(url: str, query: Any = {}) -> Any:
        res = requests.get(
            f"https://musicbrainz.org/ws/2{url}",
            params={**query, **{"fmt": "json"}},
            headers={
                "User-Agent": "Meelo Matcher/0.0.1 ( github.com/Arthi-chaud/Meelo )"
            },
        )
        return res.json()

    def compilation_artist_id(self):
        return "89ad4ac3-39f7-470e-963a-56509c546377"

    def _search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        matches = musicbrainzngs.search_artists(artist_name, limit=3)["artists"]
        return ArtistSearchResult(matches[0]["id"]) if len(matches) > 0 else None

    # Album
    def _search_album(
        self,
        album_name: str,
        artist_name: str | None,
    ) -> AlbumSearchResult | None:
        # TODO It's ugly, use an album_type variable from API
        sanitised_album_name = re.sub("\\s*-\\s*Single$", "", album_name)
        album_slug = to_slug(sanitised_album_name)
        artist_slug = to_slug(artist_name) if artist_name else None
        is_single = sanitised_album_name != album_name
        try:
            releases = musicbrainzngs.search_releases(
                sanitised_album_name,
                arid=self.compilation_artist_id if not artist_name else None,
                artist=artist_name,
                limit=10,
            )["releases"]
            release_group_key = "release-group"
            if is_single:
                releases = [
                    r
                    for r in releases
                    if r[release_group_key]["primary-type"] == "Single"
                ]
            else:
                releases = [
                    r
                    for r in releases
                    if r[release_group_key]["primary-type"] != "Single"
                ]
            releases = sorted(
                [r for r in releases if "date" in r.keys()],
                key=lambda r: r["date"],
            )
            releases = (
                [
                    r
                    for r in releases
                    if to_slug(r["artist-credit"][0]["name"]) == artist_slug
                ]
                if artist_name
                else releases
            )
            exact_matches = [
                r
                for r in releases
                if to_slug(r[release_group_key]["title"]) == album_slug
            ]
            if len(exact_matches) > 0:
                return AlbumSearchResult(exact_matches[0][release_group_key]["id"])
            return None
        except Exception as e:
            logging.error(e)
            return None

    def _get_album(self, album_id: str) -> Any | None:
        return self._fetch(
            f"/release-group/{album_id}", {"inc": " ".join(["url-rels", "genres"])}
        )

    def _get_album_release_date(self, album: Any) -> date | None:
        try:
            return datetime.strptime(album["first-release-date"], "%Y-%m-%d").date()
        except Exception:
            pass

    def _get_album_genres(self, album: Any) -> List[str] | None:
        try:
            genres: List[Any] = album["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass
