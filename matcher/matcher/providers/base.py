from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TypeVar, TypeVarTuple

from matcher.settings import BaseProviderSettings

from ..models.api.provider import Provider as ApiProviderEntry

Settings = TypeVar("Settings", bound=BaseProviderSettings, default=BaseProviderSettings)


@dataclass
class BaseFeature[*Args, Res]:
    Args = TypeVarTuple("Args")
    Res = TypeVar("Res")

    run: Callable[[*Args], Res]


@dataclass
class BaseProvider[Settings]:
    T = TypeVar("T")
    api_model: ApiProviderEntry
    settings: Settings
    features: list[BaseFeature] = field(init=False)

    def has_feature(self, t: type[T]) -> bool:
        return any(f for f in self.features if isinstance(f, t))

    def get_feature(self, t: type[T]) -> T | None:
        try:
            return [f for f in self.features if isinstance(f, t)][0]
        except Exception:
            pass
