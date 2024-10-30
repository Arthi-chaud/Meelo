from dataclasses import dataclass
from .api import API
from .settings import Settings


@dataclass
class _InternalContext:
    client: API
    settings: Settings


class Context:
    _instance: _InternalContext | None

    @classmethod
    def init(cls, client: API, settings: Settings):
        cls._instance = _InternalContext(client, settings)

    @classmethod
    def get(cls) -> _InternalContext:
        if not cls._instance:
            raise Exception("Cannot access context, it is not initialised.")
        return cls._instance
