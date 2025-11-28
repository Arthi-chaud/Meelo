from dataclasses import dataclass
from typing import Any, List
from matcher.context import Context
from matcher.providers.features import (
    GetAlbumFeature,
    GetAlbumGenresFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistIllustrationUrlFeature,
    GetArtistUrlFromIdFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
    SearchArtistFeature,
    GetMusicBrainzRelationKeyFeature,
)
from matcher.utils import capitalize_all_words
import discogs_client.client
import requests
from .domain import ArtistSearchResult
from .boilerplate import BaseProviderBoilerplate
from ..settings import DiscogsSettings
import discogs_client

# Notes:
# - We dont get descriptions because they are too short and/or technical
# - Release date for albums are just years. We could get a date from the master release but shrug
# - Searching albums is Unimplemented because need to identify singles from albums
#   Too lazy, and anyway we propably dont need info from that provider


@dataclass
class DiscogsProvider(BaseProviderBoilerplate[DiscogsSettings]):
    def __post_init__(self):
        self.features = [
            GetMusicBrainzRelationKeyFeature(lambda: "discogs"),
            SearchArtistFeature(lambda artist_name: self._search_artist(artist_name)),
            GetArtistIdFromUrlFeature(
                lambda artist_url: artist_url.replace(
                    "https://www.discogs.com/artist/", ""
                )
            ),
            GetArtistUrlFromIdFeature(
                lambda artist_id: "https://www.discogs.com/artist/" + str(artist_id)
            ),
            GetArtistFeature(lambda artist_name: self._get_artist(artist_name)),
            GetArtistIllustrationUrlFeature(
                lambda artist: self._get_artist_illustration_url(artist)
            ),
            GetWikidataArtistRelationKeyFeature(lambda: "P1953"),
            GetWikidataAlbumRelationKeyFeature(lambda: "P1954"),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://www.discogs.com/master/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: album_url.replace(
                    "https://www.discogs.com/master/", ""
                )
            ),
            GetAlbumFeature(lambda album_id: self._get_album(album_id)),
            GetAlbumGenresFeature(lambda album: self._get_album_genres(album)),
        ]

    def _headers(self):
        return {
            "Accept-Encoding": "gzip",
            "Accept": "application/vnd.discogs.v2.plaintext+json",
            "User-Agent": f"Meelo Matcher/{Context.get().settings.version}",
        }

    def _get_client(self):
        return discogs_client.Client(
            f"Meelo Matcher/{Context.get().settings.version}",
            user_token=self.settings.api_key,
        )

    async def _search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        client = self._get_client()
        try:
            return ArtistSearchResult(
                str(client.search(artist_name, type="artist")[0].id)
            )
        except Exception:
            return None

    async def _get_artist(self, artist_id: str) -> Any | None:
        try:
            return requests.get(
                f"https://api.discogs.com/artists/{artist_id}",
                headers=self._headers(),
                params={"token": self.settings.api_key},
            ).json()
        except Exception:
            return None

    async def _get_artist_illustration_url(self, artist: Any) -> str | None:
        try:
            # We sort images and take the most square one.
            images = artist["images"]
            sorted_images = sorted(
                images, key=lambda i: abs(1 - (i["width"] / i["height"]))
            )
            return sorted_images[0]["uri"]
        except Exception:
            return None

    # Album

    async def _get_album(self, album_id: str) -> Any | None:
        try:
            return requests.get(
                f"https://api.discogs.com/masters/{album_id}",
                headers=self._headers(),
                params={"token": self.settings.api_key},
            ).json()
        except Exception:
            return None

    async def _get_album_genres(self, album: Any) -> List[str] | None:
        try:
            return [capitalize_all_words(g) for g in album["genres"]]
        except Exception:
            pass
