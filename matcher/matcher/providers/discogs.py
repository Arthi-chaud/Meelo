from dataclasses import dataclass
from .base import BaseProvider
from ..settings import DiscogsSettings


@dataclass
class DiscogsProvider(BaseProvider):
    settings: DiscogsSettings
    pass
