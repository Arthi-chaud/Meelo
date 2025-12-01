import os
from unittest import mock

from dotenv import dotenv_values
from matcher.api import API
from matcher.context import Context
from matcher.models.api.provider import Provider
from matcher.providers.allmusic import AllMusicProvider
from matcher.providers.base import BaseProvider
from matcher.providers.discogs import DiscogsProvider
from matcher.providers.factory import ProviderFactory
from matcher.providers.genius import GeniusProvider
from matcher.providers.lrclib import LrcLibProvider
from matcher.providers.metacritic import MetacriticProvider
from matcher.providers.musicbrainz import MusicBrainzProvider
from matcher.providers.wikipedia import WikipediaProvider
from matcher.settings import (
    GeniusSettings,
    LrcLibSettings,
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
            LrcLibSettings(name=LrcLibSettings.name),
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
    async def reset_sessions():
        ctx = Context.get()
        await ctx.get_provider(AllMusicProvider).reset_session()
        await ctx.get_provider(MusicBrainzProvider).reset_session()
        await ctx.get_provider(DiscogsProvider).reset_session()
        await ctx.get_provider(GeniusProvider).reset_session()
        await ctx.get_provider(MetacriticProvider).reset_session()
        await ctx.get_provider(LrcLibProvider).reset_session()
        await ctx.get_provider(WikipediaProvider).reset_session()

    @staticmethod
    def is_ci():
        val = os.environ.get("CI")
        return val and (val == "1" or len(val) > 1)
