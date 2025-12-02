from dataclasses import dataclass
import datetime
from typing import Any
import json
from aiohttp import ClientSession
from matcher.context import Context
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.session import HasSession
from ..settings import AllMusicSettings
from .features import (
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistUrlFromIdFeature,
    GetMusicBrainzRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    GetWikidataArtistRelationKeyFeature,
)
from datetime import date
from bs4 import BeautifulSoup, Tag


@dataclass
class AllMusicProvider(BaseProviderBoilerplate[AllMusicSettings], HasSession):
    def __post_init__(self):
        self.features = [
            GetMusicBrainzRelationKeyFeature(lambda: "allmusic"),
            GetArtistUrlFromIdFeature(
                lambda artist_id: f"https://www.allmusic.com/artist/{artist_id}"
            ),
            GetWikidataArtistRelationKeyFeature(lambda: "P1728"),
            GetWikidataAlbumRelationKeyFeature(lambda: "P1729"),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://www.allmusic.com/album/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: album_url.replace(
                    "https://www.allmusic.com/album/", ""
                )
            ),
            GetAlbumFeature(lambda album_id: self._get_album(album_id)),
            GetAlbumRatingFeature(lambda album: self._get_album_rating(album)),
            GetAlbumReleaseDateFeature(
                lambda album: self._get_album_release_date(album)
            ),
        ]

    def mk_session(self) -> ClientSession:
        return ClientSession(
            headers={"User-Agent": f"Meelo Matcher/{Context.get().settings.version}"}
        )

    async def _get_album(self, album_id: str) -> Any | None:
        try:
            async with self.get_session().get(
                str(self.get_album_url_from_id(album_id)),
            ) as response:
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                return soup
        except Exception:
            pass

    async def _get_album_rating(self, album: Any) -> int | None:
        tag: Tag = album
        try:
            div = tag.find("div", attrs={"title": "AllMusic Rating"})
            # sth like ratingAllmusic6

            [rating_class] = [
                c
                for c in div.attrs["class"]  # pyright: ignore
                if c.startswith("ratingAllmusic")
            ]
            # e.g. '6'
            rating_raw_val = rating_class.replace("ratingAllmusic", "")
            rating = int(rating_raw_val) if rating_raw_val.isnumeric() else 0
            # We actually handle all errors with 0 instead of None
            # Because having rating == 0 means all music has not rating for the album
            if rating == 0:
                return None
            return (rating + 1) * 10
        except Exception:
            pass

    async def _get_album_release_date(self, album: Any) -> date | None:
        try:
            raw_json = album.find("script", attrs={"type": "application/ld+json"}).text
            json_obj = json.loads(raw_json)

            return datetime.datetime.strptime(
                json_obj["datePublished"], "%Y-%m-%d"
            ).date()
        except Exception:
            pass
