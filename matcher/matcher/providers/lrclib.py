from dataclasses import dataclass
import re
from typing import Any, List

from aiohttp import ClientSession
from matcher.context import Context
from matcher.models.match_result import SyncedLyrics
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.domain import SearchResult
from matcher.providers.session import HasSession
from matcher.settings import LrcLibSettings
from matcher.providers.features import (
    GetSyncedSongLyricsFeature,
    SearchSongFeature,
    GetPlainSongLyricsFeature,
    GetSongUrlFromIdFeature,
    GetSongIdFromUrlFeature,
)
from matcher.utils import asyncify


@dataclass
class LrcLibProvider(BaseProviderBoilerplate[LrcLibSettings], HasSession):
    def __post_init__(self):
        self.features = [
            SearchSongFeature(
                lambda song, artist, feat, duration: self._search_song(
                    song, artist, feat, duration
                )
            ),
            GetPlainSongLyricsFeature(
                lambda song: asyncify(self._parse_plain_lyrics, song)
            ),
            GetSyncedSongLyricsFeature(
                lambda song: asyncify(self._parse_synced_lyrics, song)
            ),
            GetSongUrlFromIdFeature(lambda id: f"https://lrclib.net/api/get/{id}"),
            GetSongIdFromUrlFeature(
                lambda url: url.replace("https://lrclib.net/api/get/", "")
            ),
        ]

    def mk_session(self) -> ClientSession:
        return ClientSession(
            base_url="https://lrclib.net/",
            headers={
                "User-Agent": f"Meelo Matcher {Context.get().settings.version} (github.com/Arthi-chaud/meelo)"
            },
        )

    async def _fetch(self, route: str):
        async with self.get_session().get("/api/" + route) as response:
            return await response.json()

    def _candidate_is_valid(self, item: Any, duration: int | None):
        if item.get("id") is None:
            return False
        item_duration = item.get("duration")
        if duration and item_duration:
            if abs(duration - item_duration) > 2:
                return False
        return True

    async def _search_song(
        self,
        song_name: str,
        artist_name: str,
        featuring: List[str],
        duration: int | None,
    ) -> SearchResult | None:
        async def _search_with_get() -> SearchResult | None:
            try:
                res = await self._fetch(
                    f"/get?artist_name={','.join([artist_name, *featuring])}&track_name={song_name}{f'&duration={duration}' if duration else ''}"
                )
                return (
                    SearchResult(res["id"], res)
                    if self._candidate_is_valid(res, duration)
                    else None
                )
            except Exception:
                pass

        async def _search_with_query() -> SearchResult | None:
            try:
                res = await self._fetch(
                    f"/search?q={', '.join([artist_name, *featuring])} - {song_name}"
                )

                for item in res:
                    if self._candidate_is_valid(item, duration):
                        return SearchResult(item["id"], item)
            except Exception:
                pass

        try:
            return (await _search_with_get()) or (await _search_with_query())
        except Exception:
            pass

    def _parse_plain_lyrics(self, song: Any) -> str | None:
        return song.get("plainLyrics")

    def _parse_synced_lyrics(self, song: Any) -> SyncedLyrics | None:
        synced_lyrics = song.get("syncedLyrics")
        if not synced_lyrics:
            return
        try:
            parsed_lyrics: SyncedLyrics = []
            for line in synced_lyrics.split("\n"):
                res = re.search("\\[(\\d{2}):(\\d{2})\\.(\\d{2})\\] (.*)", line)
                if not res:
                    return
                timestamp = (
                    float(res.group(1)) * 60
                    + float(res.group(2))
                    + (float(res.group(3)) * 0.01)
                )
                content = res.group(4)
                if not timestamp:
                    return
                parsed_lyrics.append((timestamp, content))
            return parsed_lyrics
        except Exception:
            pass
