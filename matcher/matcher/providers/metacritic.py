from dataclasses import dataclass
from typing import Any
from matcher.settings import MetacriticSettings
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..models.api.provider import Provider as ApiProviderEntry
import requests
from bs4 import BeautifulSoup, Tag
from datetime import date, datetime


@dataclass
class MetacriticProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: MetacriticSettings
    pass

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass

    def get_musicbrainz_relation_key(self) -> str | None:
        pass

    def is_musicbrainz_relation(self, rel: Any) -> bool | None:
        return "metacritic" in rel["target"]

    def get_artist_id_from_url(self, artist_url) -> str | None:
        return None

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://www.metacritic.com/person/{artist_id.removeprefix('person/')}"

    def get_artist(self, artist_id: str) -> Any | None:
        return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P1712"

    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        pass

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://www.metacritic.com/music/{album_id.replace('music/', '')}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://www.metacritic.com/music/", "")

    def get_album(self, album_id: str) -> Any | None:
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

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass
        # Note, MC's description are rarely of satisfactory quality/length
        # tag: Tag = album
        # try:
        #     description = tag.find(
        #         "span", attrs={"itemprop": "description"}
        #     ).text.strip()  # pyright: ignore
        #     return description if len(description) > 0 else None
        # except Exception:
        #     pass

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        tag: Tag = album
        try:
            release_date = tag.find(
                "span", attrs={"itemprop": "datePublished"}
            ).text.strip()  # pyright: ignore
            return datetime.strptime(release_date, "%b %d, %Y").date()
        except Exception:
            pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P1712"

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        tag: Tag = album
        try:
            raw_value = tag.find("span", attrs={"itemprop": "ratingValue"}).text  # pyright: ignore
            if not raw_value.isnumeric():
                return None
            return int(raw_value)
        except Exception:
            pass
