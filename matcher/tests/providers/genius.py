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

    def test_get_song_lyrics_and_description(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        song = provider.get_song("Rachel-stevens-some-girls")
        self.assertIsNotNone(song)
        # Lyrics
        lyrics: str = provider.get_song_lyrics(song)  # pyright: ignore
        self.assertIsNotNone(lyrics)
        lines = lyrics.split("\n")
        self.assertEqual("[Verse 1]", lines[0])
        self.assertIn("(A chat, a gift)", lines)
        self.assertIn("All I seem to get is the other, other", lines)
        # Description
        desc: str = provider.get_song_description(song)  # pyright: ignore
        self.assertIsNotNone(desc)
        self.assertTrue(
            desc.startswith("Some Girls is a single released by Rachel Stevens")
        )
        self.assertIn("album Come and Get It and", desc)

    def test_get_song_wo_lyrics_and_description(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        song = provider.get_song("Madonna-die-another-day-dirty-vegas-dub")
        self.assertIsNotNone(song)
        # Lyrics
        lyrics: str = provider.get_song_lyrics(song)  # pyright: ignore
        self.assertIsNone(lyrics)
        # Description
        desc: str = provider.get_song_description(song)  # pyright: ignore
        self.assertIsNone(desc)
