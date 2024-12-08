import unittest
from matcher.context import Context
from matcher.providers.base import BaseProvider
from tests.matcher.common import MatcherTestUtils
from matcher.providers.discogs import DiscogsProvider


class TestDiscogs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_search_artist(self):
        provider: BaseProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist = provider.search_artist("P!nk")
        self.assertIsNotNone(artist)
        self.assertEqual(artist.id, "36988")

    def test_get_artist_description_and_image(self):
        provider: BaseProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist = provider.get_artist("4480")
        self.assertIsNotNone(artist)
        description = provider.get_artist_description(artist, "")
        self.assertIsNotNone(description)
        self.assertIn("Bristol", description)  # pyright: ignore
        illustration = provider.get_artist_illustration_url(artist, "")
        self.assertIsNotNone(illustration)

    def test_get_album(self):
        provider: BaseProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        album = provider.get_album("138437")
        self.assertIsNotNone(album)
        # TODO Test Genres
