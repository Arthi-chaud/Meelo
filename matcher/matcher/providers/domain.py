from dataclasses import dataclass
from typing import TypeAlias
from enum import Enum


@dataclass
class ArtistSearchResult:
    id: str


@dataclass
class AlbumSearchResult:
    id: str


@dataclass
class SongSearchResult:
    id: str


ResourceUrl: TypeAlias = str

ResourceName: TypeAlias = str

ResourceId: TypeAlias = str


class AlbumType(Enum):
    STUDIO = "StudioRecording"
    LIVE = "LiveRecording"
    EP = "EP"
    REMIXES = "RemixAlbum"
    COMPILATION = "Compilation"
    SINGLE = "Single"
    SOUNDTRACK = "Soundtrack"
    VIDEO = "VideoAlbum"
    OTHER = "Other"
