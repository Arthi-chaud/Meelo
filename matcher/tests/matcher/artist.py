import unittest

from matcher.matcher.artist import match_artist
from tests.matcher.common import MatcherTestUtils


class TestMatchArtist(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    def test_get_artist(self):
        [matches, imageUrl] = match_artist(1, "Madonna")
        # Illustration
        self.assertIsNotNone(imageUrl)
        imageUrl = str(imageUrl)
        self.assertTrue("discogs" in imageUrl)
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.artist_id, 1)
        ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("Madonna" in str(matches.description))
        ##Sources
        self.assertEqual(len(matches.sources), 6)
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Madonna")
        ### Metacritic
        [meta] = [p for p in matches.sources if "metacritic" in p.url]
        self.assertEqual(meta.url, "https://www.metacritic.com/person/madonna")
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/3424607")
        ### Genius
        [genius] = [p for p in matches.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/artists/Madonna")
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/79239441-bfd5-4981-a70c-55c3f15c1287",
        )
        ### Allmusic
        [allmusic] = [p for p in matches.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/artist/mn0000237205")

    def test_get_artist_with_special_char(self):
        [matches, imageUrl] = match_artist(1, "P!nk")

        # Illustration
        self.assertIsNotNone(imageUrl)
        imageUrl = str(imageUrl)
        self.assertTrue("discogs" in imageUrl)
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.artist_id, 1)
        ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("American singer" in str(matches.description))
        ##Sources
        self.assertEqual(len(matches.sources), 6)
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Pink (singer)")
        ### Metacritic
        [meta] = [p for p in matches.sources if "metacritic" in p.url]
        self.assertEqual(meta.url, "https://www.metacritic.com/person/p!nk")
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/1525636")
        ### Genius
        [genius] = [p for p in matches.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/artists/P-nk")
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/f4d5cc07-3bc9-4836-9b15-88a08359bc63",
        )
        ### Allmusic
        [allmusic] = [p for p in matches.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/artist/mn0001878899")

    def test_get_artist_with_placeholder_image(self):
        [matches, imageUrl] = match_artist(1, "Peplab")
        # Illustration
        self.assertIsNotNone(imageUrl)
        imageUrl = str(imageUrl)
        # We want to get Discogs' image, not genius' as it's a placeholder
        self.assertFalse("genius" in imageUrl)
        self.assertTrue("discogs" in imageUrl)
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.artist_id, 1)
        # ##Sources
        self.assertTrue(len(matches.sources) >= 2)
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/artist/9663")
        ### Genius
        ### CI fails here (thanks cloudflare) because we do a search for this provider
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in matches.sources if "genius" in p.url]
            self.assertEqual(genius.url, "https://genius.com/artists/Peplab")
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/artist/ccccf1ba-c503-48d7-8c8c-f7c80c3347d4",
        )
