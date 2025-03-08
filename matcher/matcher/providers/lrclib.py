from dataclasses import dataclass
from typing import List
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import SearchSongFeature
from matcher.settings import LrcLibSettings


@dataclass
class LrcLibProvider(BaseProviderBoilerplate[LrcLibSettings]):
    def __post_init__(self):
        self.features = [
            SearchSongFeature(
                lambda song, artist, feat, duration: self._search_song(
                    song, artist, feat, duration
                )
            )
        ]

    def _search_song(
        self,
        song_name: str,
        artist_name: str,
        featuring: List[str],
        duration: int | None,
    ):
        pass
