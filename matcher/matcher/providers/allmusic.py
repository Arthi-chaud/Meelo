from dataclasses import dataclass
from .base import BaseProvider
from ..settings import AllMusicSettings


@dataclass
class AllMusicProvider(BaseProvider):
    settings: AllMusicSettings
    pass
