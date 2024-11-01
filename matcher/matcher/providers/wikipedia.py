from dataclasses import dataclass
from .base import BaseProvider
from ..settings import WikipediaSettings


@dataclass
class WikipediaProvider(BaseProvider):
    settings: WikipediaSettings
    pass
