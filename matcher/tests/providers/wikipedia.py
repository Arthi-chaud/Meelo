import unittest
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.wikipedia import WikipediaProvider


class TestWikipedia(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_get_album_description(self):
        provider: WikipediaProvider = Context().get().get_provider(WikipediaProvider)  # pyright: ignore
        album = provider.get_album("Do You Like My Tight Sweater?")
        self.assertIsNotNone(album)
        description = provider.get_album_description(album)
        self.assertIsNotNone(description)
        self.assertIn("Sweater", description)  # pyright: ignore
        self.assertIn("Moloko", description)  # pyright: ignore

    def test_get_artist_description(self):
        provider: WikipediaProvider = Context().get().get_provider(WikipediaProvider)  # pyright: ignore
        artist = provider.get_album("Siobhán Donaghy")
        self.assertIsNotNone(artist)
        description = provider.get_artist_description(artist)
        self.assertIsNotNone(description)
        self.assertIn("Sugababes", description)  # pyright: ignore

    def test_get_song_description(self):
        provider: WikipediaProvider = Context().get().get_provider(WikipediaProvider)  # pyright: ignore
        song = provider.get_song("Hung_Up")
        self.assertIsNotNone(song)
        description = provider.get_song_description(song)
        self.assertIsNotNone(description)
        self.assertIn("lead single", description)  # pyright: ignore
