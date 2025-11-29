from dataclasses import dataclass
import re
from typing import Any, List
import requests
from matcher.context import Context
from matcher.models.match_result import SyncedLyrics
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.settings import LrcLibSettings


@dataclass
class LrcLibProvider(BaseProviderBoilerplate[LrcLibSettings]):
    def __post_init__(self):
        self.features = []

    async def _fetch(self, route: str):
        return requests.get(
            "https://lrclib.net/api" + route,
            headers={
                "User-Agent": f"Meelo Matcher {Context.get().settings.version} (github.com/Arthi-chaud/meelo)"
            },
        ).json()

    async def _search_and_get_song(
        self,
        song_name: str,
        artist_name: str,
        featuring: List[str],
        duration: int | None,
    ):
        def _candidate_is_valid(item: Any):
            if item.get("id") is None:
                return False
            item_duration = item.get("duration")
            if duration and item_duration:
                if abs(duration - item_duration) > 2:
                    return False
            return True

        async def _search_with_get():
            res = await self._fetch(
                f"/get?artist_name={','.join([artist_name, *featuring])}&track_name={song_name}{f'&duration={duration}' if duration else ''}"
            )
            return res if _candidate_is_valid(res) else None

        async def _search_with_query():
            res = await self._fetch(
                f"/search?q={', '.join([artist_name, *featuring])} - {song_name}"
            )
            for item in res:
                if _candidate_is_valid(item):
                    return item

        try:
            return (await _search_with_get()) or (await _search_with_query())
        except Exception:
            pass

    async def _parse_plain_lyrics(self, song: Any) -> str | None:
        return song.get("plainLyrics")

    async def _parse_synced_lyrics(self, song: Any) -> SyncedLyrics | None:
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
