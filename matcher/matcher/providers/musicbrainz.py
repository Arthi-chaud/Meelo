from dataclasses import dataclass
import logging
import re
from typing import Any
from .base import ArtistSearchResult, BaseProvider, AlbumSearchResult
from ..settings import MusicBrainzSettings
from ..models.api.provider import Provider as ApiProviderEntry
import musicbrainzngs
from datetime import date, datetime


@dataclass
class MusicBrainzProvider(BaseProvider):
    api_model: ApiProviderEntry
    settings: MusicBrainzSettings
    pass

    def compilation_artist_id(self):
        return "89ad4ac3-39f7-470e-963a-56509c546377"

    def set_user_agent(self):
        logging.getLogger("musicbrainzngs").setLevel(logging.WARNING)
        musicbrainzngs.set_useragent(
            "Meelo Matcher", "0.0.1", "github.com/Arthi-chaud/Meelo"
        )

    def get_artist(self, artist_id: str) -> Any:
        self.set_user_agent()
        return musicbrainzngs.get_artist_by_id(artist_id, ["url-rels"])["artist"]

    def search_artist(self, artist_name: str) -> ArtistSearchResult | None:
        self.set_user_agent()
        matches = musicbrainzngs.search_artists(artist_name, limit=3)["artist-list"]
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
        self, album_name: str, artist_name: str | None
    ) -> AlbumSearchResult | None:
        self.set_user_agent()
        sanitised_album_name = re.sub("\\s*-\\s*Single$", "", album_name)
        try:
            releases = musicbrainzngs.search_releases(
                sanitised_album_name,
                artist=artist_name or self.compilation_artist_id,
                # inc=["release-groups"],
                limit=1000,
            )["release-list"]
            return AlbumSearchResult(releases[0]["release-group"]["id"])
        except Exception:
            return None

    def get_album_url_from_id(self, album_id: str) -> str | None:
        return f"https://musicbrainz.org/release-group/{album_id}"

    def get_album_id_from_url(self, album_url) -> str | None:
        return album_url.replace("https://musicbrainz.org/release-group/", "")

    def get_album(self, album_id: str) -> Any | None:
        self.set_user_agent()
        return musicbrainzngs.get_release_group_by_id(album_id, ["url-rels"])[
            "release-group"
        ]

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
