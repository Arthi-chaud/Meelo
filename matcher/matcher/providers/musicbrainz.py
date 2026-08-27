import asyncio
import re
import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any
from urllib.parse import urlparse

import aiohttp
from aiohttp.client import ClientSession
from aiohttp_client_cache import CacheBackend, CachedSession  # pyright: ignore

from matcher.context import Context
from matcher.logger import ERROR, log
from matcher.models.api.dto import AreaDto, LabelDto, SeriesDto
from matcher.providers.features import (
    GetAlbumFeature,
    GetAlbumGenresFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumLabelsFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumTypeFeature,
    GetAlbumSeriesFeature,
    GetAlbumUrlFromIdFeature,
    GetArea,
    GetAreaType,
    GetArtistActivityArea,
    GetArtistBirthArea,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistUrlFromIdFeature,
    GetLabelArea,
    GetLabelByMBID,
    GetLabelByName,
    GetLabelEndDate,
    GetLabelMBID,
    GetLabelStartDate,
    GetParentArea,
    GetSongFeature,
    GetSongGenresFeature,
    GetSongIdFromUrlFeature,
    GetSongUrlFromIdFeature,
    GetSeriesByMBID,
    GetSeriesByName,
    GetSeriesMBID,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataSongRelationKeyFeature,
    SearchAlbumFeature,
    SearchArtistFeature,
    SearchSongFeature,
    SearchSongWithAcoustIdFeature,
    SearchSongWithFingerprintFeature,
)

from ..settings import MusicBrainzSettings
from ..utils import (
    asyncify,
    capitalize_all_words,
    normalise_url_for_parse,
    removeprefix_or_none,
    to_slug,
)
from .boilerplate import BaseProviderBoilerplate
from .domain import AlbumType, AreaType, SearchResult
from .session import HasSession


# Stolen from https://github.com/alastair/python-musicbrainzngs/blob/master/musicbrainzngs/musicbrainz.py
class RateLimiter:
    def __init__(self):
        self.limit_interval = 1.0
        self.limit_requests = 1 if Context.is_ci() else 2
        self.last_call = 0.0
        self.lock = asyncio.Lock()
        self.remaining_requests = None

    def _update_remaining(self):
        if self.remaining_requests is None:
            self.remaining_requests = float(self.limit_requests)

        else:
            since_last_call = time.time() - self.last_call
            self.remaining_requests += since_last_call * (
                self.limit_requests / self.limit_interval
            )
            self.remaining_requests = min(
                self.remaining_requests, float(self.limit_requests)
            )

        self.last_call = time.time()

    async def rate_limit(self):
        async with self.lock:
            self._update_remaining()
            while self.remaining_requests and (self.remaining_requests < 0.999):
                await asyncio.sleep(
                    (1.0 - self.remaining_requests)
                    * (self.limit_requests / self.limit_interval)
                )
                self._update_remaining()

            if self.remaining_requests:
                self.remaining_requests -= 1.0


@dataclass
class MusicBrainzProvider(BaseProviderBoilerplate[MusicBrainzSettings], HasSession):
    def __post_init__(self):
        self.rate_limiter = RateLimiter()
        self.features = [
            GetArtistFeature(lambda artist_id: self._get_artist(artist_id)),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetArtistUrlFromIdFeature(
                lambda artist_id: f"https://musicbrainz.org/artist/{artist_id}"
            ),
            GetArtistIdFromUrlFeature(
                lambda artist_url: self._get_artist_id_from_url(artist_url)
            ),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetArtistActivityArea(
                lambda artist: self._get_artist_activity_area(artist)
            ),
            GetArtistBirthArea(lambda artist: self._get_artist_birth_area(artist)),
            GetAlbumTypeFeature(lambda album: asyncify(self._get_album_type, album)),
            GetAlbumLabelsFeature(lambda album: self._get_album_labels(album)),
            GetAlbumSeriesFeature(
                lambda album: asyncify(self._get_album_series, album)
            ),
            GetWikidataArtistRelationKeyFeature(lambda: "P434"),
            GetWikidataAlbumRelationKeyFeature(lambda: "P436"),
            SearchAlbumFeature(
                lambda album_name, artist_names: self._search_album(
                    album_name, artist_names
                )
            ),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://musicbrainz.org/release-group/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: self._get_album_id_from_url(album_url)
            ),
            GetAlbumFeature(lambda album: self._get_album(album)),
            GetAlbumReleaseDateFeature(
                lambda album: asyncify(self._get_album_release_date, album)
            ),
            GetAlbumGenresFeature(
                lambda album: asyncify(self._get_album_genres, album)
            ),
            SearchSongFeature(lambda s, a, f, _: self._search_song(s, a, f)),
            SearchSongWithFingerprintFeature(
                lambda fingerprint, dur, name: self._search_song_with_fingerprint(
                    fingerprint, dur, name
                )
            ),
            SearchSongWithAcoustIdFeature(
                lambda acoustid: self._search_song_with_acoustid(acoustid)
            ),
            GetSongFeature(lambda s: self._get_song(s)),
            GetSongGenresFeature(lambda album: asyncify(self._get_song_genres, album)),
            GetWikidataSongRelationKeyFeature(lambda: "P435"),
            GetSongUrlFromIdFeature(
                lambda song_id: f"https://musicbrainz.org/recording/{song_id}"
            ),
            GetSongIdFromUrlFeature(
                lambda song_url: self._get_song_id_from_url(song_url)
            ),
            GetArea(lambda area_mbid: self._get_area(area_mbid)),
            GetParentArea(lambda area: self._get_parent_area(area)),
            GetAreaType(lambda area: self._get_area_type(area)),
            GetLabelByName(lambda label_name: self._get_label_by_name(label_name)),
            GetLabelByMBID(lambda label_mbid: self._get_label_by_mbid(label_mbid)),
            GetLabelStartDate(lambda label: self._get_label_start_date(label)),
            GetLabelEndDate(lambda label: self._get_label_end_date(label)),
            GetLabelMBID(lambda label: self._get_label_mbid(label)),
            GetLabelArea(lambda label: self._get_label_area(label)),
            GetSeriesByName(lambda series_name: self._get_series_by_name(series_name)),
            GetSeriesByMBID(lambda series_mbid: self._get_series_by_mbid(series_mbid)),
            GetSeriesMBID(lambda series: self._get_series_mbid(series)),
        ]

    def mk_session(self) -> ClientSession:
        return CachedSession(
            base_url="https://musicbrainz.org/",
            cache=CacheBackend(expire_after=3),
            headers={
                "User-Agent": f"Meelo Matcher/{Context.get().settings.version} ( github.com/Arthi-chaud/Meelo )"
            },
        )

    # Note: Only use this method if action is not supported by library
    # E.g. Getting genres of a release-group
    async def _fetch(self, url: str, query: Any = {}) -> Any:
        session: CachedSession = self.get_session()  # pyright: ignore
        route = f"/ws/2{url}"
        is_cached = any(
            [
                route == s.path and query == s.query  # pyright: ignore (s is URL, not str)
                async for s in session.cache.get_urls()
            ]
        )
        if not is_cached:
            await self.rate_limiter.rate_limit()
        async with session.get(
            route,
            params={**query, "fmt": "json"},
        ) as response:
            res = await response.json()
            return res

    def compilation_artist_id(self):
        return "89ad4ac3-39f7-470e-963a-56509c546377"

    def _get_resource_path_from_url(self, resource_url: str) -> str | None:
        url = urlparse(normalise_url_for_parse(resource_url))
        if not url.netloc.endswith("musicbrainz.org"):
            return None
        return url.path

    def _get_artist_id_from_url(self, artist_url) -> str | None:
        path = self._get_resource_path_from_url(artist_url)
        if path:
            return removeprefix_or_none(path, "/artist/")

    def _get_album_id_from_url(self, album_url) -> str | None:
        path = self._get_resource_path_from_url(album_url)
        if path:
            return removeprefix_or_none(path, "/release-group/")

    def _get_song_id_from_url(self, song_url) -> str | None:
        path = self._get_resource_path_from_url(song_url)
        if path:
            return removeprefix_or_none(path, "/recording/")

    async def _get_artist(self, id: str) -> Any:
        return await self._fetch(f"/artist/{id}", {"inc": "url-rels+area-rels"})

    async def _get_artist_activity_area(self, artist: Any) -> AreaDto | None:
        try:
            return self._parse_area(artist["area"])
        except Exception:
            pass

    async def _get_artist_birth_area(self, artist: Any) -> AreaDto | None:
        try:
            return self._parse_area(artist["begin-area"])
        except Exception:
            pass

    async def _search_artist(self, artist_name: str) -> SearchResult | None:
        try:
            matches = await self._fetch(
                "/artist",
                {"query": artist_name, "limit": 3},
            )
            match = matches["artists"][0]
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
        artist_names: list[str],
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

        first_artist = artist_names[0] if len(artist_names) > 0 else None
        is_single = sanitised_album_name != album_name
        try:
            releases = (
                await self._fetch(
                    "/release",
                    {
                        "query": f"{sanitised_album_name.lower()} {f'arid:{self.compilation_artist_id()}' if not first_artist else f'artist:({first_artist.lower()})'}",
                        "limit": 20,
                    },
                )
            )["releases"]
            release_group_key = "release-group"
            typed_releases = []

            for r in releases:
                p_type = r[release_group_key].get("primary-type")
                if p_type is None:
                    continue
                if (is_single and p_type == "Single") or (
                    not is_single and p_type != "Single"
                ):
                    typed_releases.append(r)
            ordered_releases = sorted(
                [r for r in typed_releases if "date" in r.keys()],
                key=lambda r: r["date"],
            )
            undated_releases = [r for r in typed_releases if "date" not in r.keys()]

            def filter_by_artist(releases):
                artist_slugs = [to_slug(a) for a in artist_names]

                def release_artists_match(r: Any):
                    if not len(artist_slugs):
                        return False
                    release_artists_slugs = [
                        to_slug(a["artist"]["name"]) for a in r["artist-credit"]
                    ] + [to_slug(a["name"]) for a in r["artist-credit"]]
                    for s in artist_slugs:
                        if s not in release_artists_slugs:
                            return False
                    return True

                return [
                    r
                    for r in releases
                    if (
                        release_artists_match(r)
                        if len(artist_names) > 0
                        # Album artist is 'Various Artist'
                        else (
                            r["artist-credit"][0]["artist"]["id"]
                            == self.compilation_artist_id()
                            or any(
                                type
                                in [
                                    r[release_group_key]["primary-type"],
                                    *(
                                        r[release_group_key].get("secondary-types")
                                        or []
                                    ),
                                ]
                                for type in ["Compilation", "Soundtrack"]
                            )
                        )
                    )
                ]

            artist_releases = filter_by_artist(ordered_releases) or filter_by_artist(
                undated_releases
            )
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
        except Exception:
            return None

    async def _get_album(self, album_id: str) -> Any | None:
        res = await self._fetch(
            f"/release-group/{album_id}",
            {"inc": " ".join(["url-rels", "genres", "series-rels"])},
        )
        return res

    async def _get_album_labels(self, album: Any) -> list[LabelDto] | None:
        try:
            album_id = album["id"]
            album_first_release_date = album["first-release-date"]
            res = await self._fetch("/release", {"query": f"rgid:{album_id}"})
            releases = [
                r
                for r in res["releases"]
                # date can be an empty string
                if "date" in r
                and r["date"] == album_first_release_date
                and "label-info" in r
            ]
            labels = []
            for release in releases:
                for label in release["label-info"]:
                    label_name = label["label"]["name"]
                    label_id = label["label"]["id"]
                    known_labels = [label.name for label in labels]
                    if (
                        any(c for c in label_name if c.isascii())
                        and label_name not in known_labels
                        and label_name != "[no label]"  # Placeholder
                    ):
                        labels.append(LabelDto(name=label_name, mbid=label_id))
            return labels
        except Exception:
            return None

    def _get_album_series(self, album: Any) -> SeriesDto | None:
        try:
            relations = album["relations"]
            for rel in relations:
                if "series" not in rel:
                    continue
                series = rel["series"]
                if "type" not in series or series["type"] != "Release group series":
                    continue
                return SeriesDto(
                    name=series["name"],
                    mbid=series["id"],
                    index=self._get_series_entry_index(rel),
                )
            return None
        except Exception:
            pass

    def _get_series_entry_index(self, rel: Any) -> float | None:
        try:
            attrValKey = "attribute-values"
            orderKey = "ordering-key"
            if attrValKey in rel and "number" in rel[attrValKey]:
                str_index = rel[attrValKey]["number"]
                try:
                    return float(str_index)
                except Exception:
                    pass
            return float(rel[orderKey])
        except Exception:
            return None

    def _get_album_release_date(self, album: Any) -> date | None:
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

    def _get_album_genres(self, album: Any) -> list[str] | None:
        try:
            genres: list[Any] = album["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass

    def _get_album_type(self, album: Any) -> AlbumType | None:
        raw_types: list[str] = []
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
        if "dj-mix" in raw_types:
            return AlbumType.DJMIX
        if "compilation" in raw_types:
            return AlbumType.COMPILATION
        if "ep" in raw_types:
            return AlbumType.EP
        if "demo" in raw_types:
            return AlbumType.DEMO
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
        self, song_name: str, artist_name: str, featuring: list[str]
    ) -> SearchResult | None:
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
            match = ordered_recordings[0]
            return SearchResult(match["id"], match)
        except Exception:
            pass

    async def _search_song_with_fingerprint(
        self, fingerprint: str, duration: int, song_name: str
    ) -> SearchResult | None:
        try:
            song_slug = to_slug(song_name)
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    # Note: the 'params' are does not allow the '+' for the 'meta' field
                    f"https://api.acoustid.org/v2/lookup?client={'3WWOxoNbNH'}&duration={duration}&fingerprint={fingerprint}&meta=recordings+sources",
                ) as response:
                    recordings = (await response.json())["results"][0]["recordings"]

                    recordings = [
                        r for r in recordings if r.get("sources") and r.get("title")
                    ]
                    ## Filter recordings by title
                    recordings = [
                        r for r in recordings if to_slug(r["title"]) == song_slug
                    ]
                    ## Order recordings by sources count
                    ordered_recordings = sorted(
                        recordings,
                        key=lambda r: -r["sources"],
                    )
                    match = ordered_recordings[0]
                    return SearchResult(match["id"], match)
        except Exception:
            pass

    async def _search_song_with_acoustid(self, acoustid: str) -> SearchResult | None:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.acoustid.org/v2/lookup?client={'3WWOxoNbNH'}&trackid={acoustid}&meta=recordings+sources",
                ) as response:
                    res = (await response.json())["results"][0]["recordings"]
                    ordered_res = sorted(res, key=lambda r: r["sources"])
                    match = ordered_res[0]

                    return SearchResult(match["id"], match)
        except Exception as e:
            print(e)

    def _get_song_genres(self, song: Any) -> list[str] | None:
        try:
            genres: list[Any] = song["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass

    async def _get_area(self, mbid: str) -> Any | None:
        try:
            return await self._fetch(f"/area/{mbid}", {"inc": "area-rels"})
        except Exception:
            pass

    def _get_parent_area(self, area: Any) -> AreaDto | None:
        try:
            related_areas = area["relations"]
            parent_areas = [
                a
                for a in related_areas
                if a["direction"] == "backward" and a["target-type"] == "area"
            ]
            if len(parent_areas) == 0:
                return None
            return self._parse_area(parent_areas[0]["area"])
        except Exception:
            pass

    def _get_area_type(self, area: Any) -> AreaType | None:
        try:
            return self._parse_area_type(area["type"])
        except Exception:
            pass

    def _parse_area(self, area: Any) -> AreaDto | None:
        try:
            iso3166 = None
            if "iso-3166-1-codes" in area:
                iso3166 = (area["iso-3166-1-codes"] or [None])[0]
            return AreaDto(
                name=area["name"],
                sort_name=area["sort-name"],
                mbid=area["id"],
                iso3166=iso3166,
                type=self._parse_area_type(area["type"]),
            )
        except Exception:
            pass

    def _parse_area_type(self, area_type: str | None) -> AreaType | None:
        if area_type is None:
            return None
        if area_type in [t.value for _, t in AreaType.__members__.items()]:
            return AreaType(area_type)

    async def _get_label_by_name(self, label_name: str) -> Any | None:
        try:
            res = await self._fetch("/label/", {"query": label_name, "limit": 3})
            items = res["labels"]
            for label in items:
                if to_slug(label["name"]) == to_slug(label_name):
                    return label
        except Exception:
            pass

    async def _get_label_by_mbid(self, label_mbid: str) -> Any | None:
        try:
            return await self._fetch(f"/label/{label_mbid}")
        except Exception:
            pass

    def _parse_date(self, date_str: str) -> date | None:
        fmts = ["%Y-%m-%d", "%Y-%m", "%Y"]
        for fmt in fmts:
            try:
                return datetime.strptime(date_str, fmt).date()
            except Exception:
                continue

    def _get_label_start_date(self, label: Any) -> date | None:
        try:
            return self._parse_date(label["life-span"]["begin"])
        except Exception:
            pass

    def _get_label_end_date(self, label: Any) -> date | None:
        try:
            return self._parse_date(label["life-span"]["end"])
        except Exception:
            pass

    def _get_label_mbid(self, label: Any) -> str | None:
        try:
            return label["id"]
        except Exception:
            pass

    def _get_label_area(self, label: Any) -> AreaDto | None:
        try:
            return self._parse_area(label["area"])
        except Exception:
            pass

    async def _get_series_by_name(self, label_name: str) -> Any | None:
        try:
            res = await self._fetch("/series/", {"query": label_name, "limit": 3})
            items = res["series"]
            for label in items:
                if to_slug(label["name"]) == to_slug(label_name):
                    return label
        except Exception:
            pass

    async def _get_series_by_mbid(self, series_mbid: str) -> Any | None:
        try:
            return await self._fetch(f"/series/{series_mbid}")
        except Exception:
            pass

    def _get_series_mbid(self, series: Any) -> str | None:
        try:
            return series["id"]
        except Exception:
            pass
