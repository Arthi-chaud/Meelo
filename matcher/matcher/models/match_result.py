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
    metadata: ExternalMetadataDto | None
    illustration_url: str | None
