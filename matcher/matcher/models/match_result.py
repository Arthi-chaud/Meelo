from typing import List, Tuple
from matcher.models.api.dto import ExternalMetadataDto
from datetime import date
from dataclasses import dataclass

from matcher.providers.domain import AlbumType

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

    def set_album_type_if_none(self, album_type: AlbumType):
        self.album_type = self.album_type or album_type

    def set_release_date_if_none(self, release_date: date):
        self.release_date = self.release_date or release_date

    def push_genres(self, genres: List[str]):
        self.genres = self.genres + [g for g in genres if g not in self.genres]


@dataclass
class ArtistMatchResult:
    metadata: ExternalMetadataDto
    illustration_url: str | None

    def set_illustration_url_if_none(self, illustration_url: str):
        self.illustration_url = self.illustration_url or illustration_url
