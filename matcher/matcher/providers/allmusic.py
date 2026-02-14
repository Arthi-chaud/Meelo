from dataclasses import dataclass
import datetime
from typing import Any
import json
from urllib.parse import urlparse
from aiohttp import ClientSession
from matcher.context import Context
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.session import HasSession
from matcher.utils import asyncify, normalise_url_for_parse, removeprefix_or_none
from ..settings import AllMusicSettings
from .features import (
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistIdFromUrlFeature,
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
            GetArtistIdFromUrlFeature(
                lambda artist_url: self._get_artist_id_from_url(artist_url)
            ),
            GetArtistUrlFromIdFeature(
                lambda artist_id: f"https://www.allmusic.com/artist/{artist_id}"
            ),
            GetWikidataArtistRelationKeyFeature(lambda: "P1728"),
            GetWikidataAlbumRelationKeyFeature(lambda: "P1729"),
            GetAlbumUrlFromIdFeature(
                lambda album_id: f"https://www.allmusic.com/album/{album_id}"
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: self._get_album_id_from_url(album_url)
            ),
            GetAlbumFeature(lambda album_id: self._get_album(album_id)),
            GetAlbumRatingFeature(
                lambda album: asyncify(self._get_album_rating, album)
            ),
            GetAlbumReleaseDateFeature(
                lambda album: asyncify(self._get_album_release_date, album)
            ),
        ]

    def mk_session(self) -> ClientSession:
        return ClientSession(
            headers={"User-Agent": f"Meelo Matcher/{Context.get().settings.version}"}
        )

    def _get_resource_path_from_url(self, resource_url: str) -> str | None:
        url = urlparse(normalise_url_for_parse(resource_url))
        if not url.netloc.endswith("allmusic.com"):
            return None
        return url.path

    def _get_artist_id_from_url(self, artist_url) -> str | None:
        path = self._get_resource_path_from_url(artist_url)
        if path:
            return removeprefix_or_none(path, "/artist/")

    def _get_album_id_from_url(self, album_url) -> str | None:
        path = self._get_resource_path_from_url(album_url)
        if path:
            return removeprefix_or_none(path, "/album/")

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

    def _get_album_rating(self, album: Any) -> int | None:
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

    def _get_album_release_date(self, album: Any) -> date | None:
        try:
            raw_json = album.find("script", attrs={"type": "application/ld+json"}).text
            json_obj = json.loads(raw_json)

            return datetime.datetime.strptime(
                json_obj["datePublished"], "%Y-%m-%d"
            ).date()
        except Exception:
            pass
