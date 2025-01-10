import os
from unittest import mock

from dotenv import dotenv_values
from matcher.api import API
from matcher.context import Context
from matcher.models.api.provider import Provider
from matcher.providers.base import BaseProvider
from matcher.providers.factory import ProviderFactory
from matcher.settings import (
    GeniusSettings,
    Settings,
    WikipediaSettings,
    AllMusicSettings,
    MusicBrainzSettings,
    MetacriticSettings,
    DiscogsSettings,
)

geniusTokenKey: str = "GENIUS_ACCESS_TOKEN"
discogsTokenKey = "DISCOGS_ACCESS_TOKEN"


class MatcherTestUtils:
    @mock.patch.dict(
        os.environ,
        {
            "INTERNAL_CONFIG_DIR": "/config/",
            "API_URL": "localhost:3000",
            "API_KEYS": "a",
            "CI": os.getenv("CI") or "",
            geniusTokenKey: os.getenv(geniusTokenKey)
            or dotenv_values(".env").get(geniusTokenKey),
            discogsTokenKey: os.getenv(discogsTokenKey)
            or dotenv_values(".env").get(discogsTokenKey),
        },
    )
    @mock.patch("os.path.isfile", return_value=True)
    @mock.patch(
        "builtins.open",
        mock.mock_open(read_data=open("tests/assets/settings.json").read()),
    )
    @staticmethod
    def setup_context(_):
        settings = Settings()
        settings.push_genres = True
        settings.provider_settings = [
            MusicBrainzSettings(name=MusicBrainzSettings.name),
            MetacriticSettings(name=MetacriticSettings.name),
            WikipediaSettings(name=WikipediaSettings.name),
            AllMusicSettings(name=AllMusicSettings.name),
            GeniusSettings(
                api_key=os.environ[geniusTokenKey], name=GeniusSettings.name
            ),
            DiscogsSettings(
                api_key=os.environ[discogsTokenKey], name=DiscogsSettings.name
            ),
        ]
        providers: list[BaseProvider] = []
        for id, provider_settings in enumerate(settings.provider_settings):
            providers.append(
                ProviderFactory.buildProvider(
                    Provider(
                        id=id,
                        name=provider_settings.name,
                        slug=provider_settings.name,
                        illustration_id=None,
                    ),
                    provider_settings,
                )
            )
            pass
        Context.init(API(), settings, providers)

    @staticmethod
    def is_ci():
        val = os.environ.get("CI")
        return val and (val == "1" or len(val) > 1)
