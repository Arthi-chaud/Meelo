from dataclasses import dataclass
from typing import Any
from urllib.parse import unquote

import requests
from .base import ArtistSearchResult, BaseProvider
from ..settings import WikipediaSettings


@dataclass
class WikipediaProvider(BaseProvider):
    settings: WikipediaSettings
    pass

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        pass
    
    def get_musicbrainz_relation_key(self) -> str | None:
        return None
    
    def get_artist_id_from_url(self, artist_url:str) -> str | None:
        return artist_url.replace('https://en.wikipedia.org/wiki/', '')
    
    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://en.wikipedia.org/wiki/{artist_id}"

    # the id is the article name
    def get_artist(self, artist_id: str) -> Any | None:
        try :
            res = requests.get("https://en.wikipedia.org/w/api.php", params={
                'format': "json",
				'action': "query",
				'prop': "extracts",
				'exintro': True,
				'explaintext': True,
				'redirects': 1,
                'titles': unquote(artist_id)
            }).json()['query']['pages']
            first_entity = next(iter(res))
            return res[first_entity]
        except Exception:
            return None

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        try:
            desc:str  = artist['extract']
            return desc if not desc.startswith("Undefined may refer") else None
        except Exception:
            return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        pass

    def get_article_name_from_wikidata(self, wikidata_id: str) -> str | None:
        try:
            entities = requests.get("https://www.wikidata.org/w/api.php", params={
                'action': "wbgetentities",
				'props': "sitelinks",
				'ids': wikidata_id,
				'sitefilter': "enwiki",
				'format': "json",
            }).json()['entities']
            first_entity = next(iter(entities))
            return entities[first_entity]['sitelinks']['enwiki']['title']
        except:
            return None