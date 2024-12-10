import unittest
import datetime
from matcher.context import Context
from matcher.providers.base import BaseProvider
from tests.matcher.common import MatcherTestUtils
from matcher.providers.genius import GeniusProvider


class TestGenius(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_search_artist(self):
        provider: BaseProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.search_artist("P!nk")
        self.assertIsNotNone(artist)
        self.assertEqual(artist.id, "P!nk")  # pyright: ignore

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_artist_description_and_image(self):
        provider: BaseProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.get_artist("Massive Attack")
        self.assertIsNotNone(artist)
        description = provider.get_artist_description(artist, "")
        self.assertIsNotNone(description)
        self.assertIn("Bristol", description)  # pyright: ignore
        self.assertIn("and formerly Andy", description)  # pyright: ignore
        illustration = provider.get_artist_illustration_url(artist, "")
        self.assertIsNotNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_artist_without_image(self):
        provider: BaseProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.get_artist("Peplab")
        self.assertIsNotNone(artist)
        illustration = provider.get_artist_illustration_url(artist, "")
        self.assertIsNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_album_release_date(self):
        provider: BaseProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        album = provider.get_album("Superbus/Aeromusical")
        self.assertIsNotNone(album)
        release_date = provider.get_album_release_date(album, "")
        self.assertEqual(release_date, datetime.date(2002, 3, 26))
