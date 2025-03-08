from typing import List, Dict
from matcher.models.api.dto import ExternalMetadataDto
from datetime import date
from dataclasses import dataclass

from matcher.providers.domain import AlbumType


@dataclass
class LyricsMatchResult:
    plain: str | None
    synced: Dict[float, str] | None


@dataclass
class SongMatchResult:
    metadata: ExternalMetadataDto | None
    lyrics: str | None
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
