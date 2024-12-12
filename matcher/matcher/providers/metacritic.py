from dataclasses import dataclass
from typing import Any
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import (
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistIdFromUrlFeature,
    GetArtistUrlFromIdFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    IsMusicBrainzRelationFeature,
)
from matcher.settings import MetacriticSettings
import requests
from bs4 import BeautifulSoup, Tag
from datetime import date, datetime


@dataclass
class MetacriticProvider(BaseProviderBoilerplate[MetacriticSettings]):
    def __post_init__(self):
        self.features = [
            IsMusicBrainzRelationFeature(
                lambda _, rel: "metacritic" in rel["url"]["resource"]
            ),
            GetArtistIdFromUrlFeature(
                lambda _, url: url.replace("https://metacritic.com/person", "")
            ),
            GetArtistUrlFromIdFeature(
                lambda _,
                artist_id: f"https://www.metacritic.com/person/{artist_id.removeprefix('person/')}"
            ),
            GetWikidataArtistRelationKeyFeature(lambda _: "P1712"),
            GetAlbumUrlFromIdFeature(
                lambda _,
                album_id: f"https://www.metacritic.com/music/{album_id.replace('music/', '')}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda _, album_url: album_url.replace(
                    "https://www.metacritic.com/music/", ""
                )
            ),
            GetWikidataAlbumRelationKeyFeature(lambda _: "P1712"),
            GetAlbumFeature(lambda _, album_id: self._get_album(album_id)),
            GetAlbumReleaseDateFeature(
                lambda _, album: self._get_album_release_date(album)
            ),
            GetAlbumRatingFeature(lambda _, album: self._get_album_rating(album)),
        ]

    def _get_album(self, album_id: str) -> Any | None:
        album_url = self.get_album_url_from_id(album_id)
        try:
            html = requests.get(
                str(album_url),
                headers={"User-Agent": "Meelo Matcher/0.0.1"},
            ).text
            soup = BeautifulSoup(html, "html.parser")
            return soup
        except Exception:
            pass

    # def _get_album_description(self, album: Any, album_url: str) -> str | None:
    #     pass
    # Note, MC's description are rarely of satisfactory quality/length
    # tag: Tag = album
    # try:
    #     description = tag.find(
    #         "span", attrs={"itemprop": "description"}
    #     ).text.strip()  # pyright: ignore
    #     return description if len(description) > 0 else None
    # except Exception:
    #     pass

    def _get_album_release_date(self, album: Any) -> date | None:
        tag: Tag = album
        try:
            release_date = tag.find(
                "span", attrs={"itemprop": "datePublished"}
            ).text.strip()  # pyright: ignore
            return datetime.strptime(release_date, "%b %d, %Y").date()
        except Exception:
            pass

    def _get_album_rating(self, album: Any) -> int | None:
        tag: Tag = album
        try:
            raw_value = tag.find("span", attrs={"itemprop": "ratingValue"}).text  # pyright: ignore
            if not raw_value.isnumeric():
                return None
            return int(raw_value)
        except Exception:
            pass
