from dataclasses import dataclass
from typing import Any, List
import requests

from matcher.context import Context
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
    GetSongDescriptionFeature,
    GetSongFeature,
    GetSongIdFromUrlFeature,
    GetPlainSongLyricsFeature,
    GetSongUrlFromIdFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataSongRelationKeyFeature,
    IsMusicBrainzRelationFeature,
    SearchAlbumFeature,
    SearchArtistFeature,
    SearchSongFeature,
)
from .domain import SearchResult, SongSearchResult
from .boilerplate import BaseProviderBoilerplate
from ..settings import GeniusSettings
from urllib.parse import urlparse
from datetime import date
import re
from ..utils import to_slug
from bs4 import BeautifulSoup


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
            GetSongUrlFromIdFeature(
                lambda id: f"https://genius.com/{id.replace('-lyrics', '')}-lyrics"
            ),
            GetSongIdFromUrlFeature(
                lambda url: url.replace("-lyrics", "").replace(
                    "https://genius.com/", ""
                )
            ),
            GetSongFeature(lambda id: self._get_song(id)),
            GetPlainSongLyricsFeature(lambda s: self._get_song_lyrics(s)),
            GetSongDescriptionFeature(lambda s: self._get_song_description(s)),
            SearchSongFeature(lambda s, a, f, _: self._search_song(s, a, f)),
        ]

    async def _fetch(self, url: str, params={}, host="https://genius.com/api"):
        return requests.get(
            f"{host}{url}",
            params=params
            if host == "https://genius.com/api"
            else {**params, "access_token": self.settings.api_key},
            headers={
                "Authorization": f"{self.settings.api_key}",
                "User-Agent": f"Meelo (Matcher), {Context.get().settings.version}",
            },
        ).json()

    async def _search_artist(self, artist_name: str) -> SearchResult | None:
        try:
            artist_name = artist_name.lower()
            artists = (await self._fetch("/search/artist", {"q": artist_name}))[
                "response"
            ]["sections"][0]["hits"]
            # Sometimes search fails if the name contains ' and ' instead of ' & '
            if len(artists) == 0 and " and " in artist_name:
                artists = (
                    await self._fetch(
                        "/search/artist", {"q": artist_name.replace(" and ", " & ")}
                    )
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
                    return SearchResult(artist["result"]["name"], artist["result"])
            return None
        except Exception:
            return None

    async def _get_artist(self, artist_id: str) -> Any | None:
        try:
            artists = (await self._fetch("/search/artist", {"q": artist_id}))[
                "response"
            ]["sections"][0]["hits"]
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

    async def _get_artist_description(self, artist) -> str | None:
        try:
            artist = (
                await self._fetch(
                    artist["api_path"],
                    {"text_format": "plain"},
                    "https://api.genius.com",
                )
            )["response"]["artist"]
            desc = artist["description"]["plain"]
            if desc == "?":
                return None
            return desc
        except Exception:
            return None

    async def _get_artist_illustration_url(self, artist: Any) -> str | None:
        try:
            imageUrl = artist["image_url"]
            if "default_avatar" in imageUrl:
                return None
            return imageUrl
        except Exception:
            return None

    # Album
    async def _search_album(
        self, album_name: str, artist_name: str | None
    ) -> SearchResult | None:
        artist_slug = None if not artist_name else to_slug(artist_name)
        album_slug = to_slug(album_name)
        try:
            albums = (
                await self._fetch(
                    "/search/album", {"q": f"{album_name} {artist_name or str()}"}
                )
            )["response"]["sections"][0]["hits"]
            for album in albums:
                album = album["result"]
                if artist_slug and to_slug(album["artist"]["name"]) != artist_slug:
                    continue
                if to_slug(album["name"]) == album_slug:
                    album_url = album["url"]
                    return SearchResult(
                        str(self.get_album_id_from_url(album_url)), album
                    )
            return None
        except Exception:
            return None

    async def _get_album(self, album_id: str) -> Any | None:
        try:
            albums = (await self._fetch("/search/album", {"q": album_id}))["response"][
                "sections"
            ][0]["hits"]
            for album in albums:
                album = album["result"]
                if not album["_type"] == "album":
                    continue
                if album["url"] == self.get_album_url_from_id(album_id):
                    return album
            return None
        except Exception:
            return None

    async def _get_album_release_date(self, album: Any) -> date | None:
        try:
            album_release_date = album["release_date_components"]
            return date(
                album_release_date["year"],
                album_release_date["month"],
                album_release_date["day"],
            )
        except Exception:
            pass

    async def _get_song(self, song_id: Any) -> Any | None:
        url: str = self.get_song_url_from_id(song_id)  # pyright: ignore
        try:
            # Stolen from https://github.com/johnwmillr/LyricsGenius/blob/795a81b0d0bd63855d18dc694400fb34079f6f6f/lyricsgenius/genius.py#L95
            html = requests.get(
                url,
                headers={
                    "User-Agent": f"Meelo Matcher/{Context.get().settings.version}"
                },
            ).text.replace("<br/>", "\n")
            soup = BeautifulSoup(html, "html.parser")
            return soup
        except Exception:
            pass

    async def _get_song_lyrics(self, song: Any) -> str | None:
        html: BeautifulSoup = song
        divs = html.find_all(
            "div",
            attrs={"data-lyrics-container": "true"},
        )
        # Removing the contributor count
        for div in divs:
            try:
                to_remove = div.find(  # pyright: ignore
                    "div",
                    attrs={"data-exclude-from-selection": "true"},  # pyright: ignore
                )
                if to_remove:
                    to_remove.extract()
            except Exception:
                pass

        return self._clean_html(divs)

    async def _get_song_description(self, song: Any) -> str | None:
        html = song
        divs = html.find_all("div", class_=re.compile(r"^SongDescription[-_].+"))
        for div in divs:
            if "start the song bio" in div.get_text().lower():
                return

        # Note: There are 2 matching divs, which are nested. We are interested in the second one
        return self._clean_html(divs[1:])

    def _clean_html(self, divs: Any) -> str | None:
        if divs and len(divs) > 0:
            text: str = "\n".join([div.get_text() for div in divs])
            return text.strip("\n")

    async def _search_song(
        self, song_name: str, artist_name: str, featuring: List[str]
    ) -> SongSearchResult | None:
        try:
            response = (
                await self._fetch("/search/song", {"q": f"{artist_name} {song_name}"})
            )["response"]
            search_res = [res for res in response["sections"][0]["hits"]]
            songs = [res["result"] for res in search_res if res.get("type") == "song"]
            song_slug = to_slug(song_name)
            artist_slug = to_slug(artist_name)
            matches = []
            # For each result,
            # We filter out those where the artist does not match
            # If featuring, we look for songs with at least 1 feat artist in common
            # We select song where slug is identical or 'start with'
            # (because some songs have a remix suffix when featuring)
            for song in songs:
                artist_slugs = [to_slug(f["name"]) for f in song["primary_artists"]] + [
                    to_slug(f["name"]) for f in song["featured_artists"]
                ]
                if artist_slug not in artist_slugs:
                    continue
                if featuring:
                    feat_slug = to_slug(featuring[0])
                    if feat_slug not in artist_slugs:
                        continue
                match_slug = to_slug(song["title"])
                if match_slug != song_slug and not match_slug.startswith(song_slug):
                    continue
                matches.append(song)
            if not matches:
                return
            # If one of the matches is an exact match, return it
            # otherwise select song that is the closest to the song's slug
            final_match: Any | None = None
            for match in matches:
                if to_slug(match["title"]) == song_slug:
                    final_match = match
                    break
            if not final_match:
                ordered_matches = sorted(
                    matches,
                    # We sort matches by distance to the title
                    key=lambda s: abs(len(to_slug(s["title"])) - len(song_slug)),
                )
                final_match = ordered_matches[0]
            song_id = (
                self.get_song_id_from_url(final_match["url"]) if final_match else None
            )
            return SongSearchResult(song_id) if song_id else None
        except Exception:
            return None
