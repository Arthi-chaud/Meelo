from dataclasses import dataclass
from typing import TypeAlias


@dataclass
class ArtistSearchResult:
    id: str


@dataclass
class AlbumSearchResult:
    id: str


ResourceUrl: TypeAlias = str

ResourceName: TypeAlias = str

ResourceId: TypeAlias = str
