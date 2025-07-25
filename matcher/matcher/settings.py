import logging
import os
from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase
import json
from typing import Type, TypeVar
import jsons

T = TypeVar("T")


@dataclass_json
@dataclass
class BaseProviderSettings:
    name: str


@dataclass
class MusicBrainzSettings(BaseProviderSettings):
    name = "MusicBrainz"


@dataclass
class WikipediaSettings(BaseProviderSettings):
    name = "Wikipedia"


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class GeniusSettings(BaseProviderSettings):
    api_key: str
    name = "Genius"


@dataclass_json(letter_case=LetterCase.CAMEL)  # type: ignore
@dataclass
class DiscogsSettings(BaseProviderSettings):
    api_key: str
    name = "Discogs"


@dataclass
class AllMusicSettings(BaseProviderSettings):
    name = "AllMusic"


@dataclass
class MetacriticSettings(BaseProviderSettings):
    name = "Metacritic"


@dataclass
class LrcLibSettings(BaseProviderSettings):
    name = "LrcLib"


@dataclass
class Settings:
    push_genres: bool
    version: str
    provider_settings: list[BaseProviderSettings]

    def __init__(self):
        config_dir = os.environ.get("INTERNAL_CONFIG_DIR")
        if not config_dir:
            raise Exception("Missing env variable: 'INTERNAL_CONFIG_DIR'")
        config_path = os.path.normpath(f"{config_dir}/settings.json")
        if not os.path.isfile(config_path):
            raise Exception("Could not find settings file")
        self.version = os.environ.get("VERSION") or "unknown"
        with open(config_path) as file:
            logging.info("Reading settings file...")
            json_data = json.loads(file.read())
            self.push_genres = bool(json_data["metadata"]["useExternalProviderGenres"])
            self.provider_settings = []
            for key, provider_json in json_data["providers"].items():
                key = key.lower()
                provider_dict: dict[str, type[BaseProviderSettings]] = {
                    "musicbrainz": MusicBrainzSettings,
                    "discogs": DiscogsSettings,
                    "genius": GeniusSettings,
                    "allmusic": AllMusicSettings,
                    "wikipedia": WikipediaSettings,
                    "metacritic": MetacriticSettings,
                    "lrclib": LrcLibSettings,
                }
                if key not in provider_dict:
                    logging.warning(
                        f"Unknown provider key in settings: '{key}'. Skipping..."
                    )
                    continue
                provider_json["name"] = provider_dict[key].name
                try:
                    self.provider_settings.append(
                        provider_dict[key].schema().load(provider_json)  # type: ignore
                    )
                except jsons.UnfulfilledArgumentError as e:
                    raise Exception(
                        f"An error occured while reading settings for {key}: {e}"
                    )
            logging.info("Settings parsed successfully")

    def get_provider_setting(self, cl: Type[T]) -> T | None:
        for provider_setting in self.provider_settings:
            if isinstance(provider_setting, cl):
                return provider_setting
        return None
