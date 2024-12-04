import unittest
from .api import *
from .settings import *
from .matcher.artist import *
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    unittest.main()
