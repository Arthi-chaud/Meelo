import unittest

from matcher.matcher.artist import match_artist
from tests.matcher.common import MatcherTestUtils


class TestMatchArtist(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    async def test_get_artist(self):
        await MatcherTestUtils.reset_sessions()
        res = await match_artist(1, "Madonna")
        # Illustration
        self.assertIsNotNone(res.illustration_url)
        res.illustration_url = str(res.illustration_url)
        self.assertTrue(
            "discogs" in res.illustration_url or "genius.com" in res.illustration_url
        )
        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.artist_id, 1)
        ##Description
        self.assertIsNotNone(res.metadata.description)
        self.assertTrue("Madonna" in str(res.metadata.description))
        ##Sources
        self.assertEqual(len(res.metadata.sources), 6)
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Madonna")
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        self.assertEqual(meta.url, "https://www.metacritic.com/person/madonna")
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/3424607")
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/artists/Madonna")
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/79239441-bfd5-4981-a70c-55c3f15c1287",
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/artist/mn0000237205")
        await MatcherTestUtils.reset_sessions()

    async def test_get_artist_with_special_char(self):
        await MatcherTestUtils.reset_sessions()
        res = await match_artist(1, "P!nk")

        # Illustration
        self.assertIsNotNone(res.illustration_url)
        res.illustration_url = str(res.illustration_url)
        self.assertTrue("discogs" in res.illustration_url)
        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.artist_id, 1)
        ##Description
        self.assertIsNotNone(res.metadata.description)
        self.assertTrue("American singer" in str(res.metadata.description))
        ##Sources
        self.assertEqual(len(res.metadata.sources), 6)
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Pink (singer)")
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        self.assertEqual(meta.url, "https://www.metacritic.com/person/p!nk")
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/1525636")
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/artists/P-nk")
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/f4d5cc07-3bc9-4836-9b15-88a08359bc63",
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/artist/mn0001878899")
        await MatcherTestUtils.reset_sessions()

    async def test_get_artist_with_placeholder_image(self):
        await MatcherTestUtils.reset_sessions()
        res = await match_artist(1, "Peplab")
        # Illustration
        self.assertIsNotNone(res.illustration_url)
        res.illustration_url = str(res.illustration_url)
        # We want to get Discogs' image, not genius' as it's a placeholder
        self.assertFalse("genius" in res.illustration_url)
        self.assertTrue("discogs" in res.illustration_url)
        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.artist_id, 1)
        # ##Sources
        self.assertTrue(len(res.metadata.sources) >= 2)
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/9663")
        ### Genius
        ### CI fails here (thanks cloudflare) because we do a search for this provider
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            self.assertEqual(genius.url, "https://genius.com/artists/Peplab")
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/ccccf1ba-c503-48d7-8c8c-f7c80c3347d4",
        )
        await MatcherTestUtils.reset_sessions()
