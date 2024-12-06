import os
import logging
from typing import Any, TypeVar
from dataclasses_json import DataClassJsonMixin
import requests

from matcher.models.api.domain import Album
from matcher.models.api.dto import CreateProviderDto, ExternalMetadataDto
from matcher.models.api.page import Page
from matcher.models.api.provider import Provider

T = TypeVar("T", bound=DataClassJsonMixin)


class API:
    def __init__(self):
        self._url = os.environ.get("API_URL")
        if not self._url:
            raise Exception("Missing env variable: 'API_URL'")
        self._key = (os.environ.get("API_KEYS") or "").split(",")[0]
        if not self._key:
            raise Exception("Missing or empty env variable: 'API_KEYS'")

    def ping(self) -> bool:
        return True if self._get("/") else False

    def _get(self, route: str) -> requests.Response:
        response = requests.get(f"{self._url}{route}", headers={"x-api-key": self._key})
        if response.status_code != 200:
            logging.error("GETting API failed: ")
            raise Exception(response.content)
        return response

    def _post(
        self, route: str, json: dict = {}, file_path: str = ""
    ) -> requests.Response:
        response = requests.post(
            f"{self._url}{route}",
            headers={
                "x-api-key": self._key,
            },
            files={"file": open(file_path, "rb")} if len(file_path) else None,
            json=json if len(json.keys()) else None,
        )
        if response.status_code != 201:
            logging.error("POSTting API failed: ")
            raise Exception(response.content)
        return response

    def post_external_metadata(self, dto: ExternalMetadataDto):
        self._post("/external-metadata", json=dto.to_dict())

    def post_artist_illustration(self, artist_id: int, image_url):
        self._post(f"/artists/{artist_id}/illustration", json={"url": image_url})

    def get_providers(self) -> Page[Provider]:
        response = self._get("/external-providers").json()
        return API._to_page(response, Provider)

    def get_album(self, album_id: int) -> Album:
        response = self._get(f"/albums/{album_id}?with=artist")
        return Album.schema().load(response.json())

    def post_provider(self, provider_name: str) -> Provider:
        dto = CreateProviderDto(name=provider_name)
        response = self._post("/external-providers", json=dto.to_dict())
        return Provider.schema().load(response.json())

    def post_provider_icon(self, provider_id: int, icon_path):
        self._post(f"/external-providers/{provider_id}/icon", file_path=icon_path)

    @staticmethod
    def _to_page(obj: Any, t: type[T]) -> Page[T]:
        items = t.schema().load(obj["items"], many=True)
        return Page(items=items)
