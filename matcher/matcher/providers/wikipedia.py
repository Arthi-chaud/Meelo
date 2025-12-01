from dataclasses import dataclass
from typing import Any
from matcher.context import Context
from matcher.providers.session import HasSession
from .features import (
    GetArtistDescriptionFeature,
    GetArtistFeature,
    GetArtistIdFromUrlFeature,
    GetArtistUrlFromIdFeature,
    GetAlbumDescriptionFeature,
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumUrlFromIdFeature,
    GetSongFeature,
    GetSongDescriptionFeature,
)
from urllib.parse import unquote
from matcher.providers.boilerplate import BaseProviderBoilerplate
from ..settings import WikipediaSettings


@dataclass
class WikipediaProvider(BaseProviderBoilerplate[WikipediaSettings], HasSession):
    def __post_init__(self):
        self.features = [
            GetArtistIdFromUrlFeature(
                lambda artist_url: self.get_article_id_from_url(artist_url)
            ),
            GetArtistUrlFromIdFeature(
                lambda artist_id: self.get_article_url_from_id(artist_id)
            ),
            GetArtistFeature(lambda artist_id: self.get_article(artist_id)),
            GetArtistDescriptionFeature(
                lambda artist: self.get_article_extract(artist)
            ),
            GetAlbumIdFromUrlFeature(
                lambda album_url: self.get_article_id_from_url(album_url)
            ),
            GetAlbumUrlFromIdFeature(
                lambda album_id: self.get_article_url_from_id(album_id)
            ),
            GetAlbumFeature(lambda album_id: self.get_article(album_id)),
            GetAlbumDescriptionFeature(lambda album: self.get_article_extract(album)),
            GetSongFeature(lambda song_id: self.get_article(song_id)),
            GetSongDescriptionFeature(lambda song: self.get_article_extract(song)),
        ]

    async def get_article(self, article_id: str) -> Any | None:
        try:
            session = await self.get_session()
            async with session.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "format": "json",
                    "action": "query",
                    "prop": "extracts",
                    "exintro": "true",
                    "explaintext": "true",
                    "redirects": 1,
                    "titles": unquote(article_id),
                },
                headers={
                    "User-Agent": f"Meelo (Matcher), {Context.get().settings.version}",
                },
            ) as response:
                json = await response.json()
                res = json["query"]["pages"]
                first_entity = next(iter(res))
                return res[first_entity]
        except Exception:
            return None

    async def get_article_extract(self, article: Any) -> str | None:
        try:
            desc: str = article["extract"]
            return desc if not desc.startswith("Undefined may refer") else None
        except Exception:
            return None

    def get_article_id_from_url(self, article_url: str) -> str:
        return article_url.replace("https://en.wikipedia.org/wiki/", "")

    def get_article_url_from_id(self, article_url: str) -> str:
        return f"https://en.wikipedia.org/wiki/{article_url}"

    # the id is the article name

    async def get_article_name_from_wikidata(self, wikidata_id: str) -> str | None:
        try:
            session = await self.get_session()
            async with session.get(
                "https://www.wikidata.org/w/api.php",
                params={
                    "action": "wbgetentities",
                    "props": "sitelinks",
                    "ids": wikidata_id,
                    "sitefilter": "enwiki",
                    "format": "json",
                },
                headers={
                    "User-Agent": f"Meelo (Matcher), {Context.get().settings.version}",
                },
            ) as response:
                entities = (await response.json())["entities"]
                first_entity = next(iter(entities))
                return entities[first_entity]["sitelinks"]["enwiki"]["title"]
        except Exception:
            return None
