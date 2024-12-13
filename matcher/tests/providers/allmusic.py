import unittest
import datetime
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.allmusic import AllMusicProvider


class TestAllMusic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_get_album_rating_and_release_date(self):
        provider: AllMusicProvider = Context().get().get_provider(AllMusicProvider)  # pyright: ignore
        album = provider.get_album("mw0004378326")
        self.assertIsNotNone(album)
        rating = provider.get_album_rating(album)
        self.assertEqual(rating, 70)
        release_date = provider.get_album_release_date(album)
        self.assertEqual(release_date, datetime.date(2024, 10, 18))

    def test_get_album_rating_when_null_and_release_date(self):
        provider: AllMusicProvider = Context().get().get_provider(AllMusicProvider)  # pyright: ignore
        album = provider.get_album("mw0000770491")
        self.assertIsNotNone(album)
        rating = provider.get_album_rating(album)
        self.assertIsNone(rating)
        release_date = provider.get_album_release_date(album)
        self.assertEqual(release_date, datetime.date(2003, 3, 24))
