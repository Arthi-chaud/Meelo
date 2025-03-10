import unittest
from matcher.context import Context
from typing import List, Tuple
from matcher.models.match_result import SyncedLyrics
from matcher.providers.lrclib import LrcLibProvider
from tests.matcher.common import MatcherTestUtils


class TestLrcLib(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_search_song(self):
        scenarios: List[Tuple[str, str, List[str], int, List[int]]] = [
            ("E.T.", "Katy Perry", ["Kanye West"], 230, [960041, 3695008, 1031603]),
            (
                "It Should Be Easy",
                "Britney Spears",
                ["will.i.am"],
                209,
                [15055522],
            ),
            ("Get The Party Started", "P!nk", [], 192, [694905, 1334986, 1902620]),
            ("Intro", "Girls Aloud", [], 42, [141026, 141025]),
            ("Silver Strand", "The Corrs", [], 100, []),
            (
                "So Young (K-Klass Remix)",
                "The Corrs",
                [],
                254,
                [16406807, 385738, 10327002],
            ),
            (
                "Who's That Chick? (Single Version)",
                "David Guetta",
                ["Rihanna"],
                167,
                [3145103],
            ),
            (
                "Morenito",
                "Stephane Pompougnac",
                ["Clementine"],
                334,
                [7379532],
            ),
        ]
        provider: LrcLibProvider = Context().get().get_provider(LrcLibProvider)  # pyright: ignore

        for [song_name, artist_name, feats, duration, expected] in scenarios:
            with self.subTest(
                "Search Song", song=song_name, artist=artist_name, feats=feats
            ):
                song = provider.search_song(song_name, artist_name, feats, duration)
                if len(expected) == 0:
                    self.assertIsNone(song)
                else:
                    self.assertIsNotNone(song)
                    self.assertIn(song.id, [str(e) for e in expected])  # pyright: ignore

    def test_get_song(self):
        provider: LrcLibProvider = Context().get().get_provider(LrcLibProvider)  # pyright: ignore
        song = provider.get_song("45828")
        self.assertIsNotNone(song)
        self.assertEqual(song["id"], 45828)  # pyright: ignore
        self.assertIsNotNone(song["plainLyrics"])  # pyright: ignore
        self.assertIsNotNone(song["syncedLyrics"])  # pyright: ignore

    def test_get_song_plain_lyrics(self):
        provider: LrcLibProvider = Context().get().get_provider(LrcLibProvider)  # pyright: ignore
        song = provider.get_song("45828")
        lyrics = provider.get_plain_song_lyrics(song)
        self.assertIsNotNone(lyrics)
        lyrics = str(lyrics)
        self.assertTrue(
            lyrics.startswith("Time goes by so slowly\nTime goes by so slowly")
        )
        self.assertTrue(lyrics.endswith("I'm tired of waiting on you\n"))

    def test_get_song_synced_lyrics(self):
        provider: LrcLibProvider = Context().get().get_provider(LrcLibProvider)  # pyright: ignore
        song = provider.get_song("45828")
        lyrics: SyncedLyrics = provider.get_synced_song_lyrics(song)  # pyright: ignore

        def get_lyrics_at(ts: float):
            return [line for (t, line) in lyrics if t == ts][0]

        self.assertIsNotNone(lyrics)
        self.assertEqual(get_lyrics_at(6.71), "Time goes by so slowly")
        self.assertEqual(get_lyrics_at(229.33), "")
        self.assertEqual(get_lyrics_at(330.84), "Waiting for your call")
