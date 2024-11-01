from dataclasses import dataclass
from .base import BaseProvider
from ..settings import MusicBrainzSettings


@dataclass
class MusicBrainzProvider(BaseProvider):
    settings: MusicBrainzSettings
    pass
