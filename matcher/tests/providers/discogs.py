import unittest
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.discogs import DiscogsProvider
from typing import List, Tuple


class TestDiscogs(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    async def test_search_artist(self):
        scenarios: List[Tuple[str, str]] = [
            ("P!nk", "36988"),
            ("Christine & The Queens", "2714640"),
            ("Christine and The Queens", "2714640"),
            ("Florence + The Machine", "994835"),
            ("Florence and The Machine", "994835"),
            ("Selena Gomez & The Scene", "1867561"),
            ("Selena Gomez and the Scene", "1867561"),
        ]
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        await provider.reset_session()
        for [artist_name, expected] in scenarios:
            with self.subTest(
                "Search Artist",
                artist_name=artist_name,
                expected=expected,
            ):
                artist = await provider.search_artist(artist_name)
                self.assertIsNotNone(artist)
                self.assertEqual(artist.id, expected)  # pyright: ignore

    async def test_get_artist_image(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        await provider.reset_session()
        artist = await provider.get_artist("4480")
        self.assertIsNotNone(artist)
        illustration = await provider.get_artist_illustration_url(artist)
        self.assertIsNotNone(illustration)

    async def test_get_album_genres(self):
        provider: DiscogsProvider = Context().get().get_provider(DiscogsProvider)  # pyright: ignore
        await provider.reset_session()
        album = await provider.get_album("138437")
        self.assertIsNotNone(album)
        genres = await provider.get_album_genres(album)
        self.assertEqual(genres, ["Electronic"])
