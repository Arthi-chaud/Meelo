from dataclasses import dataclass
import re
from typing import List
import requests
from matcher.models.match_result import SyncedLyrics
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.domain import SongSearchResult
from matcher.providers.features import (
    GetSongFeature,
    GetSyncedSongLyricsFeature,
    SearchSongFeature,
    GetPlainSongLyricsFeature,
    GetSongUrlFromIdFeature,
    GetSongIdFromUrlFeature,
)
from matcher.settings import LrcLibSettings


@dataclass
class LrcLibProvider(BaseProviderBoilerplate[LrcLibSettings]):
    def __post_init__(self):
        self.features = [
            SearchSongFeature(
                lambda song, artist, feat, duration: self._search_song(
                    song, artist, feat, duration
                )
            ),
            GetSongFeature(lambda song: self._get_song(int(song))),
            GetPlainSongLyricsFeature(lambda song: song.get("plainLyrics")),
            GetSyncedSongLyricsFeature(
                lambda song: self._parse_synced_lyrics(song.get("syncedLyrics"))
            ),
            GetSongUrlFromIdFeature(lambda id: f"https://lrclib.net/api/get/{id}"),
            GetSongIdFromUrlFeature(
                lambda url: url.replace("https://lrclib.net/api/get/", "")
            ),
        ]

    def _fetch(self, route: str):
        return requests.get(
            "https://lrclib.net/api" + route,
            headers={"User-Agent": "Meelo Matcher/0.0.1"},
        ).json()

    def _search_song(
        self,
        song_name: str,
        artist_name: str,
        featuring: List[str],
        duration: int | None,
    ):
        try:
            res = self._fetch(
                f"/get?artist_name={','.join([artist_name, *featuring])}&track_name={song_name}{'&duration={duration}' if duration else ''}"
            )
            if not res.get("id"):  # Fail
                return
            res_duration = res.get("duration")
            if duration and res_duration:
                if abs(duration - res_duration) > 2:
                    return
            return SongSearchResult(str(res["id"]))
        except Exception:
            pass

    def _get_song(
        self,
        song_id: int,
    ):
        try:
            res = self._fetch(f"/get/{song_id}")
            if not res.get("id"):  # Fail
                return
            return res
        except Exception:
            pass

    def _parse_synced_lyrics(
        self,
        synced_lyrics: str | None,
    ) -> SyncedLyrics | None:
        try:
            if not synced_lyrics:
                return
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
