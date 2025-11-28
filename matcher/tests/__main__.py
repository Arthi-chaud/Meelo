import logging
import unittest
from .api import *
from .settings import *
from .matcher.artist import *
from .matcher.album import *
from .matcher.song import *
from .providers.metacritic import *
from .providers.allmusic import *
from .providers.lrclib import *
from .providers.wikipedia import *
from .providers.musicbrainz import *
from .providers.genius import *
from .providers.discogs import *
from dotenv import load_dotenv

if __name__ == "__main__":
    logging.getLogger("asyncio").setLevel(logging.ERROR)
    load_dotenv()
    unittest.main()
