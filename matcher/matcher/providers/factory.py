from typing import TypeVar, cast
from matcher.providers.allmusic import AllMusicProvider
from matcher.providers.base import BaseProvider
from matcher.providers.discogs import DiscogsProvider
from matcher.providers.genius import GeniusProvider
from matcher.providers.metacritic import MetacriticProvider
from matcher.providers.musicbrainz import MusicBrainzProvider
from matcher.settings import (
    AllMusicSettings,
    BaseProviderSettings,
    DiscogsSettings,
    GeniusSettings,
    MetacriticSettings,
    MusicBrainzSettings,
    WikipediaSettings,
)
from ..models.api.provider import Provider as ApiProviderEntry
from .wikipedia import WikipediaProvider

SettingsType = TypeVar("SettingsType", bound=BaseProviderSettings)


class ProviderFactory:
    @staticmethod
    def buildProvider(
        api_model: ApiProviderEntry, settings: BaseProviderSettings
    ) -> BaseProvider:
        match settings.name:
            case "AllMusic":
                return AllMusicProvider(api_model, cast(AllMusicSettings, settings))
            case "Genius":
                return GeniusProvider(api_model, cast(GeniusSettings, settings))
            case "Discogs":
                return DiscogsProvider(api_model, cast(DiscogsSettings, settings))
            case "Metacritic":
                return MetacriticProvider(api_model, cast(MetacriticSettings, settings))
            case "MusicBrainz":
                return MusicBrainzProvider(
                    api_model, cast(MusicBrainzSettings, settings)
                )
            case "Wikipedia":
                return WikipediaProvider(api_model, cast(WikipediaSettings, settings))
        raise Exception(f"Unknown provider name: {settings.name}")
