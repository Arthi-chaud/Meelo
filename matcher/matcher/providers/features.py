from datetime import date
from typing import Any, List
from matcher.providers.base import BaseFeature
from matcher.providers.domain import (
    AlbumSearchResult,
    AlbumType,
    ArtistSearchResult,
    ResourceId,
    ResourceUrl,
    ResourceName,
    SongSearchResult,
)


## Common
class GetUrlFromIdFeature(BaseFeature[ResourceId, ResourceUrl]):
    pass


class GetIdFromUrlFeature(BaseFeature[ResourceUrl, ResourceId]):
    pass


class GetWikidataRelationKeyFeature(BaseFeature[str]):
    pass


## Cross-relations
class GetMusicBrainzRelationKeyFeature(BaseFeature[str]):
    pass


class IsMusicBrainzRelationFeature(BaseFeature[Any, bool]):
    pass


## Artists


class SearchArtistFeature(BaseFeature[str, ArtistSearchResult | None]):
    pass


class GetArtistFeature(BaseFeature[ResourceId, Any | None]):
    pass


class GetArtistDescriptionFeature(BaseFeature[Any, str | None]):
    pass


class GetArtistIllustrationUrlFeature(BaseFeature[Any, str | None]):
    pass


class GetWikidataArtistRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass


class GetArtistUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetArtistIdFromUrlFeature(GetIdFromUrlFeature):
    pass


## Albums


class SearchAlbumFeature(
    BaseFeature[ResourceName, ResourceName | None, AlbumSearchResult | None]
):
    pass


class GetAlbumFeature(BaseFeature[ResourceId, Any | None]):
    pass


class GetAlbumDescriptionFeature(BaseFeature[Any, str | None]):
    pass


class GetAlbumRatingFeature(BaseFeature[Any, int | None]):
    pass


class GetAlbumGenresFeature(BaseFeature[Any, List[str] | None]):
    pass


class GetAlbumTypeFeature(BaseFeature[Any, AlbumType | None]):
    pass


class GetAlbumReleaseDateFeature(BaseFeature[Any, date | None]):
    pass


class GetAlbumUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetAlbumIdFromUrlFeature(GetIdFromUrlFeature):
    pass


class GetWikidataAlbumRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass


## Songs


class SearchSongFeature(
    BaseFeature[
        ResourceName,
        ResourceName,
        List[ResourceName],
        int | None,
        SongSearchResult | None,
    ]
):
    pass


class SearchSongWithAcoustIdFeature(
    BaseFeature[str, int, str, SongSearchResult | None]
):
    pass


class GetSongFeature(BaseFeature[ResourceId, Any | None]):
    pass


class GetSongDescriptionFeature(BaseFeature[Any, str | None]):
    pass


class GetSongGenresFeature(BaseFeature[Any, List[str] | None]):
    pass


class GetSongLyricsFeature(BaseFeature[Any, str | None]):
    pass


class GetSongUrlFromIdFeature(GetUrlFromIdFeature):
    pass


class GetSongIdFromUrlFeature(GetIdFromUrlFeature):
    pass


class GetWikidataSongRelationKeyFeature(GetWikidataRelationKeyFeature):
    pass
