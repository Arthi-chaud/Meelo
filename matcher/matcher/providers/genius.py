from dataclasses import dataclass
from .base import BaseProvider
from ..settings import GeniusSettings


@dataclass
class GeniusProvider(BaseProvider):
    settings: GeniusSettings
    pass
