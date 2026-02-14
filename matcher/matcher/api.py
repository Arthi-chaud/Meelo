from datetime import date
import os
import logging
from typing import Any, List, TypeVar
import aiohttp
from dataclasses_json import DataClassJsonMixin

from matcher.models.api.domain import Album, Artist, Song, File
from matcher.models.api.dto import (
    CreateProviderDto,
    ExternalMetadataDto,
    UpdateAlbumDto,
    User,
)
from matcher.models.api.page import Page
from matcher.models.api.provider import Provider
from matcher.models.match_result import SyncedLyrics
from matcher.providers.domain import AlbumType

T = TypeVar("T", bound=DataClassJsonMixin)


class API:
    def __init__(self):
        self._url = os.environ.get("API_URL")
        if not self._url:
            raise Exception("Missing env variable: 'API_URL'")
        self._key = (os.environ.get("API_KEYS") or "").split(",")[0]
        if not self._key:
            raise Exception("Missing or empty env variable: 'API_KEYS'")
        self.session = aiohttp.ClientSession(base_url=self._url)

    async def ping(self) -> bool:
        try:
            await self._get("/")
            return True
        except Exception:
            return False

    async def _get(self, route: str, token: str | None = None) -> Any:
        async with self.session.get(
            route,
            headers={"Authorization": f"Bearer {token}"}
            if token
            else {"x-api-key": self._key},
        ) as response:
            if response.status != 200:
                logging.error("GETting API failed: ")
                raise Exception(await response.text())
            return await response.json()

    async def _post(self, route: str, json: dict = {}, file_path: str = "") -> Any:
        async with self.session.post(
            route,
            headers={
                "x-api-key": self._key,
            },
            data={"file": open(file_path, "rb")} if len(file_path) else None,
            json=json if len(json.keys()) else None,
        ) as response:
            if response.status != 201:
                logging.error("POSTting API failed: ")
                raise Exception(await response.text())
            return await response.json()

    async def _put(self, route: str, json: dict = {}, file_path: str = "") -> None:
        async with self.session.put(
            route,
            headers={
                "x-api-key": self._key,
            },
            data={"file": open(file_path, "rb")} if len(file_path) else None,
            json=json if len(json.keys()) else None,
        ) as response:
            if response.status != 200:
                logging.error("PUTting API failed: ")
                raise Exception(await response.text())

    async def post_external_metadata(self, dto: ExternalMetadataDto):
        await self._post("/external-metadata", json=dto.to_dict())

    async def post_artist_illustration(self, artist_id: int, image_url):
        await self._post(
            "/illustrations/url",
            json={"url": image_url, "artistId": artist_id},
        )

    async def get_artist_external_metadata(
        self, artistId: int
    ) -> ExternalMetadataDto | None:
        return await self._get_external_metadata(f"artist={artistId}")

    async def get_album_external_metadata(
        self, albumId: int
    ) -> ExternalMetadataDto | None:
        return await self._get_external_metadata(f"album={albumId}")

    async def get_song_external_metadata(
        self, songId: int
    ) -> ExternalMetadataDto | None:
        return await self._get_external_metadata(f"song={songId}")

    async def _get_external_metadata(self, query: str) -> ExternalMetadataDto | None:
        try:
            json = await self._get(f"/external-metadata?{query}")
            return ExternalMetadataDto.schema().load(json)
        except Exception:
            pass

    async def get_providers(self) -> Page[Provider]:
        response = await self._get("/external-providers")
        return API._to_page(response, Provider)

    async def get_album(self, album_id: int, token: str | None = None) -> Album:
        json = await self._get(
            f"/albums/{album_id}?with=artist,localIdentifiers", token
        )
        return Album.schema().load(json)

    async def get_artist(self, artist_id: int, token: str | None = None) -> Artist:
        json = await self._get(f"/artists/{artist_id}?with=localIdentifiers", token)
        return Artist.schema().load(json)

    async def get_song(self, song_id: int, token: str | None = None) -> Song:
        json = await self._get(
            f"/songs/{song_id}?with=artist,featuring,master,localIdentifiers", token
        )
        return Song.schema().load(json)

    async def get_file(self, file_id: int) -> File:
        json = await self._get(f"/files/{file_id}")
        return File.schema().load(json)

    async def get_user(self, token: str) -> User | None:
        try:
            json = await self._get("/users/me", token)
            return User.schema().load(json)
        except Exception:
            return None

    async def post_provider(self, provider_name: str) -> Provider:
        dto = CreateProviderDto(name=provider_name)
        json = await self._post("/external-providers", json=dto.to_dict())
        return Provider.schema().load(json)

    async def post_provider_icon(self, provider_id: int, icon_path):
        await self._post(f"/external-providers/{provider_id}/icon", file_path=icon_path)

    async def post_album_update(
        self,
        album_id: int,
        release_date: date | None,
        genres: List[str] | None,
        type: AlbumType | None,
    ):
        dto = UpdateAlbumDto(
            release_date=release_date.isoformat() if release_date else None,
            genres=genres,
            type=type.value if type else None,
        )
        await self._put(f"/albums/{album_id}", json=dto.to_dict())

    async def post_song_lyrics(
        self, song_id: int, plain_lyrics: str, synced_lyrics: SyncedLyrics | None
    ):
        dto = {"plain": plain_lyrics}
        if synced_lyrics:
            formatted = [
                {"timestamp": t, "content": line} for (t, line) in synced_lyrics
            ]
            dto = {**dto, "synced": formatted}
        await self._post(f"/songs/{song_id}/lyrics", json=dto)

    async def post_song_genres(self, song_id: int, genres: List[str]):
        await self._put(f"/songs/{song_id}", json={"genres": genres})

    @staticmethod
    def _to_page(obj: Any, t: type[T]) -> Page[T]:
        items = t.schema().load(obj["items"], many=True)
        return Page(items=items)
