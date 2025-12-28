from datetime import date
from typing import Any, Awaitable, List
from matcher.models.match_result import SyncedLyrics
from matcher.providers.base import BaseFeature
from matcher.providers.domain import (
    AlbumType,
    ResourceId,
    ResourceUrl,
    ResourceName,
    SearchResult,
)


## Common
class GetUrlFromIdFeature(BaseFeature[ResourceId, ResourceUrl]):
    pass


class GetIdFromUrlFeature(BaseFeature[ResourceUrl, ResourceId]):
    pass


class GetWikidataRelationKeyFeature(BaseFeature[str]):
    pass


class IsUrlFeature(BaseFeature[ResourceUrl, bool]):
    pass


## Cross-relations
class GetMusicBrainzRelationKeyFeature(BaseFeature[str]):
    pass


class IsMusicBrainzRelationFeature(BaseFeature[Any, bool]):
    pass


## Artists


class SearchArtistFeature(BaseFeature[str, Awaitable[SearchResult | None]]):
    pass


class GetArtistFeature(BaseFeature[ResourceId, Awaitable[Any | None]]):
    pass


class GetArtistDescriptionFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetArtistIllustrationUrlFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetWikidataArtistRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass


class GetArtistUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetArtistIdFromUrlFeature(GetIdFromUrlFeature):
    pass


class IsArtistUrlFeature(IsUrlFeature):
    pass


## Albums


class SearchAlbumFeature(
    BaseFeature[ResourceName, ResourceName | None, Awaitable[SearchResult | None]]
):
    pass


class GetAlbumFeature(BaseFeature[ResourceId, Awaitable[Any | None]]):
    pass


class GetAlbumDescriptionFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetAlbumRatingFeature(BaseFeature[Any, Awaitable[int | None]]):
    pass


class GetAlbumGenresFeature(BaseFeature[Any, Awaitable[List[str] | None]]):
    pass


class GetAlbumTypeFeature(BaseFeature[Any, Awaitable[AlbumType | None]]):
    pass


class GetAlbumReleaseDateFeature(BaseFeature[Any, Awaitable[date | None]]):
    pass


class GetAlbumUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetAlbumIdFromUrlFeature(GetIdFromUrlFeature):
    pass


class GetWikidataAlbumRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass


class IsAlbumUrlFeature(IsUrlFeature):
    pass


## Songs


class SearchSongFeature(
    BaseFeature[
        ResourceName,
        ResourceName,
        List[ResourceName],
        int | None,
        Awaitable[SearchResult | None],
    ]
):
    pass


class SearchSongWithAcoustIdFeature(
    BaseFeature[str, int, str, Awaitable[SearchResult | None]]
):
    pass


class GetSongFeature(BaseFeature[ResourceId, Awaitable[Any | None]]):
    pass


class GetSongDescriptionFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetSongGenresFeature(BaseFeature[Any, Awaitable[List[str] | None]]):
    pass


class GetPlainSongLyricsFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetSyncedSongLyricsFeature(BaseFeature[Any, Awaitable[SyncedLyrics | None]]):
    pass


class GetSongUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetSongIdFromUrlFeature(GetIdFromUrlFeature):
    pass


class GetWikidataSongRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass


class IsSongUrlFeature(IsUrlFeature):
    pass
