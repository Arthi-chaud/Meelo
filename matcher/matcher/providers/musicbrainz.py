from dataclasses import dataclass
import logging
import re
from typing import Any, List
import warnings
from matcher.context import Context

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
    GetWikidataSongRelationKeyFeature,
    GetSongFeature,
    SearchAlbumFeature,
    GetAlbumFeature,
    GetAlbumTypeFeature,
    SearchArtistFeature,
    SearchSongFeature,
    SearchSongWithAcoustIdFeature,
    GetSongGenresFeature,
    GetSongUrlFromIdFeature,
    GetSongIdFromUrlFeature,
)
from ..utils import capitalize_all_words, to_slug
from .domain import AlbumType, SearchResult, SongSearchResult
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
        self.features = [
            GetArtistFeature(lambda artist_id: self._get_artist(artist_id)),
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
            GetAlbumTypeFeature(lambda album: self._get_album_type(album)),
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
            SearchSongFeature(lambda s, a, f, _: self._search_song(s, a, f)),
            SearchSongWithAcoustIdFeature(
                lambda acoustid, dur, name: self._search_song_with_acoustid(
                    acoustid, dur, name
                )
            ),
            GetSongFeature(lambda s: self._get_song(s)),
            GetSongGenresFeature(lambda album: self._get_song_genres(album)),
            GetWikidataSongRelationKeyFeature(lambda: "P435"),
            GetSongUrlFromIdFeature(
                lambda song_id: f"https://musicbrainz.org/recording/{song_id}"
            ),
            GetSongIdFromUrlFeature(
                lambda song_url: song_url.replace(
                    "https://musicbrainz.org/recording/", ""
                )
            ),
        ]

    def _set_user_agent(self):
        musicbrainzngs.set_useragent(
            "Meelo Matcher",
            Context.get().settings.version,
            "github.com/Arthi-chaud/Meelo",
        )

    # Note: Only use this method if action is not supported by library
    # E.g. Getting genres of a release-group
    @_rate_limit
    @staticmethod
    async def _fetch(url: str, query: Any = {}) -> Any:
        res = requests.get(
            f"https://musicbrainz.org/ws/2{url}",
            params={**query, **{"fmt": "json"}},
            headers={
                "User-Agent": f"Meelo Matcher/{Context.get().settings.version} ( github.com/Arthi-chaud/Meelo )"
            },
        )
        return res.json()

    def compilation_artist_id(self):
        return "89ad4ac3-39f7-470e-963a-56509c546377"

    async def _get_artist(self, id: str) -> Any:
        self._set_user_agent()
        return musicbrainzngs.get_artist_by_id(id, ["url-rels"])

    async def _search_artist(self, artist_name: str) -> SearchResult | None:
        self._set_user_agent()
        matches = musicbrainzngs.search_artists(artist_name, limit=3)["artists"]
        try:
            match = matches[0]
            id = match.get("id")
            return SearchResult(
                str(id), None
            )  # Not returning artist here because 'get' returns more info
        except Exception:
            pass

    # To search albums, sometimes we need to replace acronyms
    def _sanitise_acronyms(self, s: str) -> str:
        res = re.sub(r"volume", "Vol.", s, flags=re.IGNORECASE)
        res = re.sub(r"&", "and", res)
        return res

    # Album
    async def _search_album(
        self,
        album_name: str,
        artist_name: str | None,
    ) -> SearchResult | None:
        album_name = self._sanitise_acronyms(album_name)
        # TODO It's ugly, use an album_type variable from API
        sanitised_album_name = re.sub(
            "(\\s*-\\s*(Single|EP))|(\\s*[\\(\\[]Remixes[\\)\\]])$",
            "",
            album_name,
            flags=re.IGNORECASE,
        )
        album_slug = to_slug(sanitised_album_name)

        artist_slug = to_slug(artist_name) if artist_name else None
        is_single = sanitised_album_name != album_name
        try:
            self._set_user_agent()
            releases = musicbrainzngs.search_releases(
                sanitised_album_name,
                arid=self.compilation_artist_id if not artist_name else None,
                artist=artist_name,
                limit=20,
            )["releases"]
            release_group_key = "release-group"
            typed_releases = [
                r
                for r in releases
                if (
                    r[release_group_key].get("primary-type") == "Single"
                    if is_single
                    else r[release_group_key].get("primary-type") != "Single"
                )
            ]
            ordered_releases = (
                sorted(
                    [r for r in typed_releases if "date" in r.keys()],
                    key=lambda r: r["date"],
                )
                or typed_releases
            )
            artist_releases = [
                r
                for r in ordered_releases
                if (
                    to_slug(r["artist-credit"][0]["name"]) == artist_slug
                    if artist_name
                    # Album artist is 'Various Artist'
                    else (
                        r["artist-credit"][0]["artist"]["id"]
                        == self.compilation_artist_id()
                        or any(
                            [
                                type
                                in [
                                    r[release_group_key]["primary-type"],
                                    *(
                                        r[release_group_key].get("secondary-types")
                                        or []
                                    ),
                                ]
                                for type in ["Compilation", "Soundtrack"]
                            ]
                        )
                    )
                )
            ]
            exact_matches = [
                r
                for r in artist_releases
                if to_slug(self._sanitise_acronyms(r[release_group_key]["title"]))
                == album_slug
            ]
            if len(exact_matches) > 0:
                match = exact_matches[0][release_group_key]
                return SearchResult(match["id"], match)
            return None
        except Exception as e:
            logging.error(e)
            return None

    async def _get_album(self, album_id: str) -> Any | None:
        return await self._fetch(
            f"/release-group/{album_id}", {"inc": " ".join(["url-rels", "genres"])}
        )

    async def _get_album_release_date(self, album: Any) -> date | None:
        str_release_date = album.get("first-release-date")
        if not str_release_date:
            return None
        for format in ["%Y-%m-%d", "%Y-%m", "%Y"]:
            try:
                parsed = datetime.strptime(str_release_date, format)
                if parsed:
                    return parsed.date()
            except Exception:
                continue

    async def _get_album_genres(self, album: Any) -> List[str] | None:
        try:
            genres: List[Any] = album["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass

    async def _get_album_type(self, album: Any) -> AlbumType | None:
        raw_types: List[str] = []
        if album.get("primary-type"):
            raw_types.append(album["primary-type"])
        if album.get("secondary-types"):
            raw_types.extend(album["secondary-types"])
        raw_types = [t.lower() for t in raw_types]
        if raw_types == ["album"]:
            return AlbumType.STUDIO
        if "remix" in raw_types:
            return AlbumType.REMIXES
        if "live" in raw_types:
            return AlbumType.LIVE
        if "compilation" in raw_types:
            return AlbumType.COMPILATION
        if "ep" in raw_types:
            return AlbumType.EP
        if "dj-mix" in raw_types:
            return AlbumType.REMIXES
        return None

    async def _get_song(self, recording_id: str) -> Any | None:
        try:
            # mbngz does not accept genres as recording include
            recording = await self._fetch(
                f"/recording/{recording_id}",
                {
                    "inc": "+".join(
                        ["work-rels", "url-rels", "genres", "work-level-rels"]
                    )
                },
            )
            return recording
        except Exception:
            pass

    # This method returns a recording ID
    # It's simpler for us to use a recording instead of finding a work because
    # - Finding the work from a recording requires a new query
    # - Work dont include genres, recordings do
    async def _search_song(
        self, song_name: str, artist_name: str, featuring: List[str]
    ) -> SongSearchResult | None:
        try:
            recordings = (
                await self._fetch(
                    "/recording",
                    {
                        "query": f"work:{song_name.replace('.', '')} and artistname:{artist_name}",
                        "limit": 100,
                    },
                )
            )["recordings"]
            artist_slug = to_slug(artist_name)
            song_slug = to_slug(song_name)
            artist_recordings = []
            for r in recordings:
                if r.get("video"):
                    continue
                if to_slug(r["title"]) != song_slug:
                    continue
                artists = [to_slug(a["name"]) for a in r["artist-credit"]]
                if artist_slug not in artists:
                    continue
                if not featuring:
                    artist_recordings.append(r)
                    continue
                for f in featuring:
                    if to_slug(f) in artists:
                        artist_recordings.append(r)
                        break
            ordered_recordings = [
                r
                for r in artist_recordings
                if (r.get("disambiguation") or "main") == "main"
            ] or artist_recordings
            return SongSearchResult(ordered_recordings[0]["id"])
        except Exception:
            pass

    async def _search_song_with_acoustid(
        self, acoustid: str, duration: int, song_name: str
    ) -> SongSearchResult | None:
        try:
            song_slug = to_slug(song_name)
            recordings = requests.get(
                # Note: the 'params' are does not allow the '+' for the 'meta' field
                f"https://api.acoustid.org/v2/lookup?client={'3WWOxoNbNH'}&duration={duration}&fingerprint={acoustid}&meta=recordings+sources",
            ).json()["results"][0]["recordings"]

            recordings = [r for r in recordings if r.get("sources") and r.get("title")]
            ## Filter recordings by title
            recordings = [r for r in recordings if to_slug(r["title"]) == song_slug]
            ## Order recordings by sources count
            ordered_recordings = sorted(
                recordings,
                key=lambda r: -r["sources"],
            )
            return SongSearchResult(ordered_recordings[0]["id"])
        except Exception:
            pass

    async def _get_song_genres(self, song: Any) -> List[str] | None:
        try:
            genres: List[Any] = song["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass
