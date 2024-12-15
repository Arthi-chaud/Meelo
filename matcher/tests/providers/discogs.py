import unittest
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.discogs import DiscogsProvider


class TestDiscogs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_search_artist(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist = provider.search_artist("P!nk")
        self.assertIsNotNone(artist)
        self.assertEqual(artist.id, "36988")  # pyright: ignore

    def test_search_artist_with_alias(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist1 = provider.search_artist("Christine & The Queen")
        artist2 = provider.search_artist("Christine and The Queen")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "2714640")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_search_artist_with_and(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist1 = provider.search_artist("Florence + The Machine")
        artist2 = provider.search_artist("Florence and the machine")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "994835")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_search_artist_with_and_2(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist1 = provider.search_artist("Selena Gomez & The Scene")
        artist2 = provider.search_artist("Selena Gomez and the Scene")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "1867561")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_get_artist_description_and_image(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        artist = provider.get_artist("4480")
        self.assertIsNotNone(artist)
        description = provider.get_artist_description(artist)
        self.assertIsNotNone(description)
        self.assertIn("Bristol", description)  # pyright: ignore
        illustration = provider.get_artist_illustration_url(artist)
        self.assertIsNotNone(illustration)

    def test_get_album_genres(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        album = provider.get_album("138437")
        self.assertIsNotNone(album)
        genres = provider.get_album_genres(album)
        self.assertEqual(genres, ["Electronic"])
