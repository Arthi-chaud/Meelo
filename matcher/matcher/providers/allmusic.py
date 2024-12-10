from dataclasses import dataclass
import datetime
from typing import Any, List
import json
import requests
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..models.api.provider import Provider as ApiProviderEntry
from ..settings import AllMusicSettings
from datetime import date
from bs4 import BeautifulSoup, Tag


@dataclass
class AllMusicProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: AllMusicSettings
    pass

    def get_musicbrainz_relation_key(self) -> str | None:
        return "allmusic"

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://www.allmusic.com/artist/{artist_id}"

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass

    def get_artist_id_from_url(self, artist_url) -> str | None:
        pass

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P1728"

    # Album
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        pass

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://www.allmusic.com/album/{album_id}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://www.allmusic.com/album/", "")

    def get_album(self, album_id: str) -> Any | None:
        try:
            html = requests.get(
                str(self.get_album_url_from_id(album_id)),
                headers={"User-Agent": "Meelo Matcher/0.0.1"},
            ).text
            soup = BeautifulSoup(html, "html.parser")
            return soup
        except Exception:
            pass

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
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

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        try:
            raw_json = album.find("script", attrs={"type": "application/ld+json"}).text
            json_obj = json.loads(raw_json)

            return datetime.datetime.strptime(
                json_obj["datePublished"], "%Y-%m-%d"
            ).date()
        except Exception:
            pass

    def get_album_genres(self, album: Any, album_url: str) -> List[str] | None:
        pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P1729"
