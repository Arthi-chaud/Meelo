import os
import logging
import requests

from matcher.models.event import json


class API:
    def __init__(self):
        self._url = os.environ.get("API_URL")
        if not self._url:
            logging.error("Missing env variable: 'API_URL'")
            exit(1)
        self._key = (os.environ.get("API_KEYS") or "").split(",")[0]
        if not self._key:
            logging.error("Missing or empty env variable: 'API_KEYS'")
            exit(1)

    def ping(self) -> bool:
        print(self._url)
        return True if self._get("/") else False

    def _get(self, route: str) -> object | None:
        response = requests.get(f"{self._url}{route}", headers={"x-api-key": self._key})
        if response.status_code != 200:
            logging.error("GETting API failed: ")
            logging.error(response.content)
            return None
        jsonResponse = json.loads(response.content)
        return jsonResponse
