from typing import List, Tuple
from matcher.models.api.dto import AreaDto, ExternalMetadataDto
from datetime import date
from dataclasses import dataclass

from matcher.providers.domain import AlbumType, AreaType

type SyncedLyrics = List[Tuple[float, str]]


@dataclass
class LyricsMatchResult:
    plain: str | None
    synced: SyncedLyrics | None


@dataclass
class SongMatchResult:
    metadata: ExternalMetadataDto
    lyrics: LyricsMatchResult
    genres: List[str]

    def set_synced_lyrics(self, lyrics: SyncedLyrics):
        self.lyrics.synced = lyrics
        self.lyrics.plain = "\n".join([line for (_, line) in self.lyrics.synced])

    def set_plain_lyrics_if_none(self, lyrics: str):
        self.lyrics.plain = self.lyrics.plain or lyrics

    def push_genres(self, genres: List[str]):
        self.genres = self.genres + [g for g in genres if g not in self.genres]


@dataclass
class AlbumMatchResult:
    metadata: ExternalMetadataDto
    release_date: date | None
    album_type: AlbumType | None
    genres: List[str]
    labels: List[str]

    def set_album_type_if_none(self, album_type: AlbumType):
        self.album_type = self.album_type or album_type

    def set_release_date_if_none(self, release_date: date):
        self.release_date = self.release_date or release_date

    def push_genres(self, genres: List[str]):
        self.genres = self.genres + [g for g in genres if g not in self.genres]

    def push_labels(self, labels: List[str]):
        self.labels = self.labels + [
            label for label in labels if label not in self.labels
        ]


@dataclass
class ArtistMatchResult:
    metadata: ExternalMetadataDto
    illustration_url: str | None
    activity_area: AreaDto | None
    birth_area: AreaDto | None

    def set_illustration_url_if_none(self, illustration_url: str):
        self.illustration_url = self.illustration_url or illustration_url

    def set_activity_area_if_none(self, area: AreaDto):
        self.activity_area = self.activity_area or area

    def set_birth_area_if_none(self, area: AreaDto):
        self.birth_area = self.birth_area or area


@dataclass
class AreaMatchResult:
    parent_area: AreaDto | None
    type: AreaType | None

    def set_parent_area_if_none(self, parent: AreaDto):
        self.parent_area = self.parent_area or parent

    def set_area_type_if_none(self, area_type: AreaType):
        self.type = self.type or area_type
