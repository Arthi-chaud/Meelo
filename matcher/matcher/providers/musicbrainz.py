from dataclasses import dataclass
import logging
import re
from typing import Any, List
from ..utils import capitalize_all_words
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..settings import MusicBrainzSettings
from ..models.api.provider import Provider as ApiProviderEntry
import musicbrainzngs
from musicbrainzngs.musicbrainz import _rate_limit
import requests
from datetime import date, datetime


@dataclass
class MusicBrainzProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: MusicBrainzSettings

    def __init__(self, api_model, settings) -> None:
        self.api_model = api_model
        self.settings = settings
        # Ignore warning at runtime, the library uses XML and does not parse everything we want (like genres)
        logging.getLogger("musicbrainzngs").setLevel(logging.ERROR)
        musicbrainzngs.set_format("json")
        musicbrainzngs.set_useragent(
            "Meelo Matcher", "0.0.1", "github.com/Arthi-chaud/Meelo"
        )

    # Note: Only use this method if action is not supported by library
    # E.g. Getting genres of a release-group
    @_rate_limit
    @staticmethod
    def _fetch(url: str, query: Any = {}) -> Any:
        res = requests.get(
            f"https://musicbrainz.org/ws/2{url}",
            params={**query, **{"fmt": "json"}},
            headers={
                "User-Agent": "Meelo Matcher/0.0.1 ( github.com/Arthi-chaud/Meelo )"
            },
        )
        return res.json()

    def compilation_artist_id(self):
        return "89ad4ac3-39f7-470e-963a-56509c546377"

    def get_artist(self, artist_id: str) -> Any:
        return musicbrainzngs.get_artist_by_id(artist_id, ["url-rels"])

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        matches = musicbrainzngs.search_artists(artist_name, limit=3)["artists"]
        return ArtistSearchResult(matches[0]["id"]) if len(matches) > 0 else None

    def get_musicbrainz_relation_key(self) -> str | None:
        return None

    def get_artist_id_from_url(self, artist_url) -> str | None:
        return artist_url.replace("https://musicbrainz.org/artist/", "")

    def get_artist_url_from_id(self, artist_id: str) -> str | None:
        return f"https://musicbrainz.org/artist/{artist_id}"

    def get_artist_description(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_artist_illustration_url(self, artist: Any, artist_url: str) -> str | None:
        return None

    def get_wikidata_artist_relation_key(self) -> str | None:
        return "P434"

    # Album
    def search_album(
        self,
        album_name: str,
        artist_name: str | None,
    ) -> AlbumSearchResult | None:
        # TODO It's ugly, use an album_type variable from API
        sanitised_album_name = re.sub("\\s*-\\s*Single$", "", album_name)
        is_single = sanitised_album_name != album_name
        try:
            releases = musicbrainzngs.search_releases(
                sanitised_album_name,
                arid=self.compilation_artist_id if not artist_name else None,
                artist=artist_name,
                limit=10,
            )["releases"]
            releases = [r["release-group"] for r in releases if r]
            if is_single:
                releases = [r for r in releases if r["primary-type"] == "Single"]
            else:
                releases = [r for r in releases if r["primary-type"] != "Single"]
            return AlbumSearchResult(releases[0]["id"])
        except Exception as e:
            logging.error(e)
            return None

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://musicbrainz.org/release-group/{album_id}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://musicbrainz.org/release-group/", "")

    def get_album(self, album_id: str) -> Any | None:
        return self._fetch(
            f"/release-group/{album_id}", {"inc": " ".join(["url-rels", "genres"])}
        )

    def get_album_description(self, album: Any, album_url: str) -> str | None:
        pass

    def get_album_release_date(self, album: Any, album_url: str) -> date | None:
        try:
            return datetime.strptime(album["first-release-date"], "%Y-%m-%d").date()
        except Exception:
            pass

    def get_wikidata_album_relation_key(self) -> str | None:
        return "P436"

    def get_album_rating(self, album: Any, album_url: str) -> int | None:
        pass

    def get_album_genres(self, album: Any, album_url: str) -> List[str] | None:
        try:
            genres: List[Any] = album["genres"]
            return [
                capitalize_all_words(genre["name"])
                for genre in genres
                if genre["count"] > 0
            ]
        except Exception:
            pass
