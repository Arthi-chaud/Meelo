from dataclasses import dataclass
from typing import Any, List
from urllib.parse import unquote
from ..models.api.provider import Provider as ApiProviderEntry
import requests
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..settings import WikipediaSettings
from datetime import date


@dataclass
class WikipediaProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: WikipediaSettings
    pass

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass

    def get_musicbrainz_relation_key(self) -> str | None:
        return None

    def get_article(self, article_id: str) -> Any | None:
        try:
            res = requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "format": "json",
                    "action": "query",
                    "prop": "extracts",
                    "exintro": True,
                    "explaintext": True,
                    "redirects": 1,
                    "titles": unquote(article_id),
                },
            ).json()["query"]["pages"]
            first_entity = next(iter(res))
            return res[first_entity]
        except Exception:
            return None

    def get_article_extract(self, article: Any) -> str | None:
        try:
            desc: str = article["extract"]
            return desc if not desc.startswith("Undefined may refer") else None
        except Exception:
            return None

    def get_article_id_from_url(self, article_url: str) -> str:
        return article_url.replace("https://en.wikipedia.org/wiki/", "")

    def get_article_url_from_id(self, article_url: str) -> str:
        return f"https://en.wikipedia.org/wiki/{article_url}"

    def get_artist_id_from_url(self, artist_url: str) -> str | None:
        return self.get_article_id_from_url(artist_url)

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return self.get_article_url_from_id(artist_id)

    # the id is the article name
    def get_artist(self, artist_id: str) -> Any | None:
        return self.get_article(artist_id)

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return self.get_article_extract(artist)

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        pass

    def get_article_name_from_wikidata(self, wikidata_id: str) -> str | None:
        try:
            entities = requests.get(
                "https://www.wikidata.org/w/api.php",
                params={
                    "action": "wbgetentities",
                    "props": "sitelinks",
                    "ids": wikidata_id,
                    "sitefilter": "enwiki",
                    "format": "json",
                },
            ).json()["entities"]
            first_entity = next(iter(entities))
            return entities[first_entity]["sitelinks"]["enwiki"]["title"]
        except Exception:
            return None

    # Album
    def search_album(
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        pass

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return self.get_album_url_from_id(album_id)

    def get_album_id_from_url(self, album_url) -> str | None:
        return self.get_article_id_from_url(album_url)

    def get_album(self, album_id: str) -> Any | None:
        return self.get_article(album_id)

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        return self.get_article_extract(album)

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        pass

    def get_wikidata_album_relation_key(self) -> str | None:
        pass

    def get_album_genres(self, album: Any, album_url: str) -> List[str] | None:
        pass

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        pass
