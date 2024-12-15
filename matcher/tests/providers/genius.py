import unittest
import datetime
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.genius import GeniusProvider


class TestGenius(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_search_artist(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.search_artist("P!nk")
        self.assertIsNotNone(artist)
        self.assertEqual(artist.id, "P!nk")  # pyright: ignore

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_search_artist_with_alias(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist1 = provider.search_artist("Christine & The Queens")
        artist2 = provider.search_artist("Christine and The Queens")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "Christine and the Queens")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_search_artist_with_and(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist1 = provider.search_artist("Florence + The Machine")
        artist2 = provider.search_artist("Florence and the machine")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "Florence + the Machine")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_search_artist_with_and_2(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist1 = provider.search_artist("Selena Gomez & The Scene")
        artist2 = provider.search_artist("Selena Gomez and the Scene")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "Selena Gomez & The Scene")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_artist_description_and_image(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.get_artist("Massive Attack")
        self.assertIsNotNone(artist)
        description = provider.get_artist_description(
            artist,
        )
        self.assertIsNotNone(description)
        self.assertIn("Bristol", description)  # pyright: ignore
        self.assertIn("and formerly Andy", description)  # pyright: ignore
        illustration = provider.get_artist_illustration_url(
            artist,
        )
        self.assertIsNotNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_artist_without_image(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        artist = provider.get_artist("Peplab")
        self.assertIsNotNone(artist)
        illustration = provider.get_artist_illustration_url(
            artist,
        )
        self.assertIsNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    def test_get_album_release_date(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        album = provider.get_album("Superbus/Aeromusical")
        self.assertIsNotNone(album)
        release_date = provider.get_album_release_date(
            album,
        )
        self.assertEqual(release_date, datetime.date(2002, 3, 26))
