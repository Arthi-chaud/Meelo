from dataclasses import dataclass
from typing import List, TypeVar, Type
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.thread import ProviderTask, ProviderThread
from .api import API
from .settings import Settings

T = TypeVar("T", bound=BaseProviderBoilerplate)


@dataclass
class CurrentItem:
    name: str
    id: int
    type: str


@dataclass
class _InternalContext:
    client: API
    settings: Settings
    provider_threads: List[ProviderThread]
    handled_items_count: int
    pending_items_count: int
    current_item: CurrentItem | None = None

    async def run_provider_task(self, t: ProviderTask) -> None:
        for provider_t in self.provider_threads:
            provider_t.process_task(t)
        for provider_t in self.provider_threads:
            provider_t.wait_for_task_end()

    def get_provider(self, cl: Type[T]) -> T | None:
        p = self.get_provider_thread(cl)
        return p.provider if p else None

    def get_provider_thread(self, cl: Type[T]) -> ProviderThread[T] | None:
        for provider_t in self.provider_threads:
            if isinstance(provider_t.provider, cl):
                return provider_t
        return None

    def get_providers(
        self,
    ) -> List[BaseProviderBoilerplate]:
        return [p.provider for p in self.provider_threads]

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
        threads = [ProviderThread(p) for p in providers]
        cls._instance = _InternalContext(client, settings, threads, 0, 0)

    @classmethod
    def get(cls) -> _InternalContext:
        if not cls._instance:
            raise Exception("Cannot access context, it is not initialised.")
        return cls._instance
