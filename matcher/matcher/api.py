import os
import logging
from typing import Any
from dataclasses_json import DataClassJsonMixin
import requests

from matcher.models.api.page import Page
from matcher.models.api.provider import Provider


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

    def get_providers(self) -> Page[Provider]:
        response = self._get("/external-providers").json()
        return API._to_page(response, Provider)

    @staticmethod
    def _to_page[T: DataClassJsonMixin](obj: Any, t: type[T]) -> Page[T]:
        items = t.schema().load(obj["items"], many=True)
        return Page(items=items)
