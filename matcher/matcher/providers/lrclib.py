from dataclasses import dataclass
from typing import Any
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import (
    GetAlbumFeature,
    GetAlbumIdFromUrlFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumUrlFromIdFeature,
    GetArtistIdFromUrlFeature,
    GetArtistUrlFromIdFeature,
    GetWikidataArtistRelationKeyFeature,
    GetWikidataAlbumRelationKeyFeature,
    IsMusicBrainzRelationFeature,
)
from matcher.settings import LrcLibSettings
import requests
from bs4 import BeautifulSoup, Tag
from datetime import date, datetime


@dataclass
class LrcLibProvider(BaseProviderBoilerplate[LrcLibSettings]):
    def __post_init__(self):
        self.features = []
