from collections.abc import Awaitable
from datetime import date
from typing import Any

from matcher.models.api.dto import AreaDto, LabelDto, SeriesDto
from matcher.models.match_result import SyncedLyrics
from matcher.providers.base import BaseFeature
from matcher.providers.domain import (
    AlbumType,
    AreaType,
    ResourceId,
    ResourceName,
    ResourceUrl,
    SearchResult,
)


## Common
class GetUrlFromIdFeature(BaseFeature[ResourceId, ResourceUrl]):
    pass


class GetIdFromUrlFeature(BaseFeature[ResourceUrl, ResourceId | None]):
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


class GetArtistActivityArea(BaseFeature[Any, Awaitable[AreaDto | None]]):
    pass


class GetArtistBirthArea(BaseFeature[Any, Awaitable[AreaDto | None]]):
    pass


## Albums


class SearchAlbumFeature(
    BaseFeature[ResourceName, list[ResourceName], Awaitable[SearchResult | None]]
):
    pass


class GetAlbumSeriesFeature(BaseFeature[Any, Awaitable[SeriesDto | None]]):
    pass


class GetAlbumFeature(BaseFeature[ResourceId, Awaitable[Any | None]]):
    pass


class GetAlbumDescriptionFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetAlbumRatingFeature(BaseFeature[Any, Awaitable[int | None]]):
    pass


class GetAlbumGenresFeature(BaseFeature[Any, Awaitable[list[str] | None]]):
    pass


class GetAlbumLabelsFeature(BaseFeature[Any, Awaitable[list[LabelDto] | None]]):
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
        list[ResourceName],
        int | None,
        Awaitable[SearchResult | None],
    ]
):
    pass


class SearchSongWithFingerprintFeature(
    BaseFeature[str, int, str, Awaitable[SearchResult | None]]
):
    pass


class SearchSongWithAcoustIdFeature(BaseFeature[str, Awaitable[SearchResult | None]]):
    pass


class GetSongFeature(BaseFeature[ResourceId, Awaitable[Any | None]]):
    pass


class GetSongDescriptionFeature(BaseFeature[Any, Awaitable[str | None]]):
    pass


class GetSongGenresFeature(BaseFeature[Any, Awaitable[list[str] | None]]):
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


## Areas


class GetArea(BaseFeature[str, Awaitable[AreaDto | None]]):
    pass


class GetParentArea(BaseFeature[Any, AreaDto | None]):
    pass


class GetAreaType(BaseFeature[Any, AreaType | None]):
    pass


## Label


class GetLabelByName(BaseFeature[str, Awaitable[Any | None]]):
    pass


class GetLabelByMBID(BaseFeature[str, Awaitable[Any | None]]):
    pass


class GetLabelStartDate(BaseFeature[Any, date | None]):
    pass


class GetLabelEndDate(BaseFeature[Any, date | None]):
    pass


class GetLabelArea(BaseFeature[Any, AreaDto | None]):
    pass


class GetLabelMBID(BaseFeature[Any, str | None]):
    pass


## Series


class GetSeriesByName(BaseFeature[str, Awaitable[Any | None]]):
    pass


class GetSeriesByMBID(BaseFeature[str, Awaitable[Any | None]]):
    pass


class GetSeriesMBID(BaseFeature[Any, str | None]):
    pass
