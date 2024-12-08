import unittest
from .api import *
from .settings import *
from .matcher.artist import *
from .matcher.album import *
from .providers.metacritic import *
from .providers.allmusic import *
from .providers.wikipedia import *

from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    unittest.main()
