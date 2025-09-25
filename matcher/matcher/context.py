from dataclasses import dataclass
from typing import List, TypeVar, Type
from matcher.providers.boilerplate import BaseProviderBoilerplate
from .api import API
from .settings import Settings

T = TypeVar("T", bound=BaseProviderBoilerplate)


@dataclass
class _InternalContext:
    client: API
    settings: Settings
    providers: List[BaseProviderBoilerplate]
    handled_items_count: int
    pending_items_count: int

    def get_provider(self, cl: Type[T]) -> T | None:
        for provider in self.providers:
            if isinstance(provider, cl):
                return provider
        return None

    def increment_handled_items_count(self):
        self.handled_items_count = self.handled_items_count + 1

    def clear_handled_items_count(self):
        self.handled_items_count = 0


class Context:
    _instance: _InternalContext | None

    @classmethod
    def init(
        cls, client: API, settings: Settings, providers: List[BaseProviderBoilerplate]
    ):
        cls._instance = _InternalContext(client, settings, providers, 0, 0)

    @classmethod
    def get(cls) -> _InternalContext:
        if not cls._instance:
            raise Exception("Cannot access context, it is not initialised.")
        return cls._instance
