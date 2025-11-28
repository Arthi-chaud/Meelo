import unittest
from matcher.context import Context
from matcher.matcher.song import match_song
from tests.matcher.common import MatcherTestUtils


class TestMatchSong(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    async def test_get_song_with_featuring_artist(self):
        res = await match_song(
            1, "It Should Be Easy", "Britney Spears", ["will.i.am"], None, None
        )
        # Genres
        self.assertIn("Pop", res.genres)
        self.assertIn("Dance-Pop", res.genres)
        self.assertIn("Electronic", res.genres)
        # Lyrics

        if not MatcherTestUtils.is_ci():
            self.assertIsNotNone(res.lyrics)
            self.assertIsNotNone(res.lyrics.plain)
            self.assertIsNotNone(res.lyrics.synced)

            self.assertIn("I've been thinking", res.lyrics.plain)
            self.assertIn(
                "baby, you're my right now\n",
                res.lyrics.plain,
            )
            self.assertEqual(
                15.22,
                res.lyrics.synced[0][0],
            )
            self.assertEqual(
                "I've been thinking",
                res.lyrics.synced[0][1],
            )

        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.song_id, 1)
        ##Description
        if not MatcherTestUtils.is_ci():
            self.assertIsNotNone(res.metadata.description)
            self.assertTrue("will.i.am" in str(res.metadata.description))
        ##Sources
        self.assertGreaterEqual(len(res.metadata.sources), 1)
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            self.assertEqual(
                genius.url,
                "https://genius.com/Britney-spears-it-should-be-easy-lyrics",
            )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/recording/b4e91acc-17d6-4e1a-b08e-e06714bab7bd",
        )

    async def test_get_song_ignore_genres(self):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = await match_song(
            1, "It Should Be Easy", "Britney Spears", ["will.i.am"], None, None
        )
        # Teardown
        context.settings.push_genres = True
        # Genres
        self.assertEqual(len(res.genres), 0)
