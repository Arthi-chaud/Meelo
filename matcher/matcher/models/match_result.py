from typing import List, Tuple
from matcher.models.api.dto import ExternalMetadataDto
from datetime import date
from dataclasses import dataclass

from matcher.providers.domain import AlbumType

type SyncedLyrics = List[Tuple[float, str]]


@dataclass
class LyricsMatchResult:
    plain: str
    synced: SyncedLyrics | None


@dataclass
class SongMatchResult:
    metadata: ExternalMetadataDto | None
    lyrics: LyricsMatchResult | None
    genres: List[str]


@dataclass
class AlbumMatchResult:
    metadata: ExternalMetadataDto | None
    release_date: date | None
    album_type: AlbumType | None
    genres: List[str]


@dataclass
class ArtistMatchResult:
    metadata: ExternalMetadataDto
    illustration_url: str | None

    def set_illustration_url_if_none(self, illustration_url: str):
        self.illustration_url = self.illustration_url or illustration_url
