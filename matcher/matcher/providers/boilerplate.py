from matcher.providers.base import BaseProvider
from datetime import date
from .features import (
    GetAlbumDescriptionFeature,
    GetAlbumFeature,
    GetAlbumGenresFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumTypeFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistDescriptionFeature,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistIllustrationUrlFeature,
    GetArtistUrlFromIdFeature,
    GetMusicBrainzRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    IsMusicBrainzRelationFeature,
    SearchAlbumFeature,
    SearchArtistFeature,
)
from .domain import AlbumSearchResult, AlbumType, ArtistSearchResult
from typing import Any, List


# A = ParamSpec("A")
# R = TypeVar("R")
# F = TypeVar("F", bound=BaseFeature, covariant=True)


class BaseProviderBoilerplate[S](BaseProvider[S]):
    # def _run_feature_if_exists[A, R, F: BaseFeature[A, R]](
    #     self, featureClass: Type[F]
    # ) -> R | None:
    #     f = self.get_feature(featureClass)
    #     return f.run()

    def get_musicbrainz_relation_key(self) -> str | None:
        f = self.get_feature(GetMusicBrainzRelationKeyFeature)
        return f.run() if f else None

    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        f = self.get_feature(IsMusicBrainzRelationFeature)
        return f.run(rel) if f else None

    # Artist
    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        f = self.get_feature(SearchArtistFeature)
        return f.run(artist_name) if f else None

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        f = self.get_feature(GetArtistUrlFromIdFeature)
        return f.run(artist_id) if f else None

    def get_artist_id_from_url(self, artist_url) -> str | None:
        f = self.get_feature(GetArtistIdFromUrlFeature)
        return f.run(artist_url) if f else None

    def get_artist(self, artist_id: str) -> Any | None:
        f = self.get_feature(GetArtistFeature)
        return f.run(artist_id) if f else None

    def get_artist_description(self, artist: Any) -> str | None:
        f = self.get_feature(GetArtistDescriptionFeature)
        return f.run(artist) if f else None

    def get_artist_illustration_url(self, artist: Any) -> str | None:
        f = self.get_feature(GetArtistIllustrationUrlFeature)
        return f.run(artist) if f else None

    def get_wikidata_artist_relation_key(self) -> str | None:
        f = self.get_feature(GetWikidataArtistRelationKeyFeature)
        return f.run() if f else None

    # Album
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        f = self.get_feature(SearchAlbumFeature)
        return f.run(album_name, artist_name) if f else None

    def get_album_url_from_id(self, album_id: str) -> str | None:
        f = self.get_feature(GetAlbumUrlFromIdFeature)
        return f.run(album_id) if f else None

    def get_album_id_from_url(self, album_url) -> str | None:
        f = self.get_feature(GetAlbumIdFromUrlFeature)
        return f.run(album_url) if f else None

    def get_album(self, album_id: str) -> Any | None:
        f = self.get_feature(GetAlbumFeature)
        return f.run(album_id) if f else None

    def get_album_description(self, album: Any) -> str | None:
        f = self.get_feature(GetAlbumDescriptionFeature)
        return f.run(album) if f else None

    def get_album_rating(self, album: Any) -> int | None:
        f = self.get_feature(GetAlbumRatingFeature)
        return f.run(album) if f else None

    def get_album_type(self, album: Any) -> AlbumType | None:
        f = self.get_feature(GetAlbumTypeFeature)
        return f.run(album) if f else None

    def get_album_genres(self, album: Any) -> List[str] | None:
        f = self.get_feature(GetAlbumGenresFeature)
        return f.run(album) if f else None

    def get_album_release_date(self, album: Any) -> date | None:
        f = self.get_feature(GetAlbumReleaseDateFeature)
        return f.run(album) if f else None

    def get_wikidata_album_relation_key(self) -> str | None:
        f = self.get_feature(GetWikidataAlbumRelationKeyFeature)
        return f.run() if f else None
