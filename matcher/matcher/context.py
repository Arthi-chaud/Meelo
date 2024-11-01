from dataclasses import dataclass
from typing import List, TypeVar, Type
from matcher.providers.base import BaseProvider
from .api import API
from .settings import Settings

T = TypeVar("T", bound=BaseProvider)


@dataclass
class _InternalContext:
    client: API
    settings: Settings
    providers: List[BaseProvider]

    def get_provider(self, cl: Type[T]) -> T | None:
        for provider in self.providers:
            if isinstance(provider, cl):
                return provider
        return None


class Context:
    _instance: _InternalContext | None

    @classmethod
    def init(cls, client: API, settings: Settings, providers: List[BaseProvider]):
        cls._instance = _InternalContext(client, settings, providers)

    @classmethod
    def get(cls) -> _InternalContext:
        if not cls._instance:
            raise Exception("Cannot access context, it is not initialised.")
        return cls._instance
