from dataclasses import dataclass
from matcher.settings import MetacriticSettings
from .base import BaseProvider


@dataclass
class MetacriticProvider(BaseProvider):
    settings: MetacriticSettings
    pass
