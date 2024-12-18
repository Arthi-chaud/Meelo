import unittest
from matcher.matcher.song import match_song
from tests.matcher.common import MatcherTestUtils


class TestMatchSong(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    def test_get_song_with_featuring_artist(self):
        [matches, lyrics, genres] = match_song(
            1, "It Should Be Easy", "Britney Spears", ["will.i.am"]
        )
        # Genres
        self.assertIn("Pop", genres)
        self.assertIn("Dance-Pop", genres)
        self.assertIn("Electronic", genres)
        # Lyrics

        if not MatcherTestUtils.is_ci():
            self.assertIsNotNone(lyrics)

            self.assertIn("[Verse 1: Britney Spears]", lyrics)
            self.assertIn(
                "baby, you my right now\nIf there was a scale",
                lyrics,
            )

        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.song_id, 1)
        ##Description
        if not MatcherTestUtils.is_ci():
            self.assertIsNotNone(matches.description)
            self.assertTrue("will.i.am" in str(matches.description))
        ##Sources
        self.assertGreaterEqual(len(matches.sources), 2)
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in matches.sources if "genius" in p.url]
            self.assertEqual(
                genius.url,
                "https://genius.com/Britney-spears-it-should-be-easy-lyrics",
            )
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/recording/b4e91acc-17d6-4e1a-b08e-e06714bab7bd",
        )
