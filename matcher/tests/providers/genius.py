import unittest
import datetime
from matcher.context import Context
from matcher.providers.domain import SongSearchResult
from tests.matcher.common import MatcherTestUtils
from matcher.providers.genius import GeniusProvider
from typing import List, Tuple


class TestGenius(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_search_artist(self):
        scenarios: List[Tuple[str, str]] = [
            ("P!nk", "P!nk"),
            ("Christine & The Queens", "Christine and the Queens"),
            ("Christine and The Queens", "Christine and the Queens"),
            ("Florence + The Machine", "Florence + the Machine"),
            ("Florence and The Machine", "Florence + the Machine"),
            ("Selena Gomez & The Scene", "Selena Gomez & The Scene"),
            ("Selena Gomez and the Scene", "Selena Gomez & The Scene"),
        ]
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
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

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_artist_description_and_image(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        artist = await provider.get_artist("Massive Attack")
        self.assertIsNotNone(artist)
        print(artist)
        description = await provider.get_artist_description(
            artist,
        )
        self.assertIsNotNone(description)
        self.assertIn("Bristol", description)  # pyright: ignore
        self.assertIn("and formerly Andy", description)  # pyright: ignore
        illustration = await provider.get_artist_illustration_url(
            artist,
        )
        self.assertIsNotNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_artist_without_image(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        artist = await provider.get_artist("Peplab")
        self.assertIsNotNone(artist)
        illustration = await provider.get_artist_illustration_url(
            artist,
        )
        self.assertIsNone(illustration)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_album_release_date(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        album = await provider.get_album("Superbus/Aeromusical")
        self.assertIsNotNone(album)
        release_date = await provider.get_album_release_date(
            album,
        )
        self.assertEqual(release_date, datetime.date(2002, 3, 26))

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_song_lyrics(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        song = await provider.get_song("Girls-aloud-models")
        self.assertIsNotNone(song)
        # Lyrics
        lyrics: str = await provider.get_plain_song_lyrics(song)  # pyright: ignore
        self.assertIsNotNone(lyrics)
        lines = lyrics.split("\n")
        self.assertEqual("[Intro: Sarah & Cheryl]", lines[0])
        self.assertEqual(
            "Girls girls girls girls girls girls girls", lines[len(lines) - 1]
        )

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_song_lyrics_and_description(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        song = await provider.get_song("Rachel-stevens-some-girls")
        self.assertIsNotNone(song)
        # Lyrics
        lyrics: str = await provider.get_plain_song_lyrics(song)  # pyright: ignore
        self.assertIsNotNone(lyrics)
        lines = lyrics.split("\n")
        self.assertEqual("[Verse 1]", lines[0])
        self.assertIn("(A chat, a gift)", lines)
        self.assertIn("All I seem to get is the other, other", lines)
        # Description
        desc: str = await provider.get_song_description(song)  # pyright: ignore
        self.assertIsNotNone(desc)
        self.assertTrue(
            desc.startswith("Some Girls is a single released by Rachel Stevens")
        )
        self.assertIn("album Come and Get It and", desc)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_get_song_wo_lyrics_and_description(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        song = await provider.get_song("Madonna-die-another-day-dirty-vegas-dub")
        self.assertIsNotNone(song)
        # Lyrics
        lyrics: str = await provider.get_plain_song_lyrics(song)  # pyright: ignore
        self.assertIsNone(lyrics)
        # Description
        desc: str = await provider.get_song_description(song)  # pyright: ignore
        self.assertIsNone(desc)

    @unittest.skipIf(MatcherTestUtils.is_ci(), "")
    async def test_search_song(self):
        provider: GeniusProvider = Context().get().get_provider(GeniusProvider)  # pyright: ignore
        await provider.reset_session()
        scenarios: List[Tuple[str, str, List[str], str | None]] = [
            ("Overrated", "Siobhan Donaghy", [], "Siobhan-donaghy-overrated"),
            ("Work B**ch", "Britney Spears", [], "Britney-spears-work-bch-work-work"),
            ("Work Bitch", "Britney Spears", [], "Britney-spears-work-bitch"),
            ("Gimme More", "Britney Spears", [], "Britney-spears-gimme-more"),
            ("Anti-Hero", "Taylor Swift", [], "Taylor-swift-anti-hero"),
            ("E.T.", "Katy Perry", [], "Katy-perry-et"),
            ("E.T.", "Katy Perry", ["Kanye West"], "Katy-perry-et-remix"),
            ("Fun For Me", "Moloko", [], "Moloko-fun-for-me"),
            ("M!ssundaztood", "P!nk", [], "P-nk-m-ssundaztood"),
            (
                "Bad Romance (Chew Fu H1N1 Fix)",
                "Lady Gaga",
                [],
                "Lady-gaga-bad-romance-chew-fu-h1n1-fix",
            ),
            # ("Drive", "Peplab", [], None),
        ]
        for [song_name, artist_name, feat, expected] in scenarios:
            with self.subTest(
                "Search Song",
                song_name=song_name,
                artist_name=artist_name,
                feat=feat,
                expected=expected,
            ):
                search_res: SongSearchResult = await provider.search_song(
                    song_name, artist_name, feat, None
                )  # pyright: ignore
                if expected:
                    self.assertIsNotNone(search_res)
                    self.assertEqual(search_res.id, expected)
                else:
                    self.assertIsNone(search_res)
