import unittest
import datetime
from matcher.context import Context
from matcher.providers.base import BaseProvider
from tests.matcher.common import MatcherTestUtils
from matcher.providers.metacritic import MetacriticProvider


class TestMetacritic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_get_album_rating_and_release_date(self):
        provider: BaseProvider = Context().get().get_provider(MetacriticProvider)  # pyright: ignore
        album = provider.get_album("renaissance/beyonce")
        self.assertIsNotNone(album)
        rating = provider.get_album_rating(album, "")
        self.assertEqual(rating, 91)
        release_date = provider.get_album_release_date(album, "")
        self.assertEqual(release_date, datetime.date(2022, 7, 29))
