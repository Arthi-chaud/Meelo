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
    GetSongDescriptionFeature,
    GetSongFeature,
    GetSongGenresFeature,
    GetSongIdFromUrlFeature,
    GetSyncedSongLyricsFeature,
    GetPlainSongLyricsFeature,
    GetSongUrlFromIdFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataSongRelationKeyFeature,
    IsMusicBrainzRelationFeature,
    SearchAlbumFeature,
    SearchArtistFeature,
    SearchSongFeature,
    SearchSongWithAcoustIdFeature,
)
from .domain import AlbumSearchResult, AlbumType, ArtistSearchResult, SongSearchResult
from typing import Any, List, Dict


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

    # Song

    def search_song(
        self,
        song_name: str,
        artist_name: str,
        featuring_artists: List[str],
        duration: int | None,
    ) -> SongSearchResult | None:
        f = self.get_feature(SearchSongFeature)
        return f.run(song_name, artist_name, featuring_artists, duration) if f else None

    def search_song_with_acoustid(
        self, song_acoustid: str, duration: int, song_name: str
    ) -> SongSearchResult | None:
        f = self.get_feature(SearchSongWithAcoustIdFeature)
        return f.run(song_acoustid, duration, song_name) if f else None

    def get_song(self, song_id: str) -> Any | None:
        f = self.get_feature(GetSongFeature)
        return f.run(song_id) if f else None

    def get_song_description(self, song: Any) -> str | None:
        f = self.get_feature(GetSongDescriptionFeature)
        return f.run(song) if f else None

    def get_song_genres(self, song: Any) -> List[str] | None:
        f = self.get_feature(GetSongGenresFeature)
        return f.run(song) if f else None

    def get_plain_song_lyrics(self, song: Any) -> str | None:
        f = self.get_feature(GetPlainSongLyricsFeature)
        return f.run(song) if f else None

    def get_synced_song_lyrics(self, song: Any) -> Dict[float, str] | None:
        f = self.get_feature(GetSyncedSongLyricsFeature)
        return f.run(song) if f else None

    def get_wikidata_song_relation_key(self) -> str | None:
        f = self.get_feature(GetWikidataSongRelationKeyFeature)
        return f.run() if f else None

    def get_song_url_from_id(self, song_id: str) -> str | None:
        f = self.get_feature(GetSongUrlFromIdFeature)
        return f.run(song_id) if f else None

    def get_song_id_from_url(self, song_url) -> str | None:
        f = self.get_feature(GetSongIdFromUrlFeature)
        return f.run(song_url) if f else None
