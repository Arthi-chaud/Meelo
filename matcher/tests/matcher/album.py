import unittest
import datetime
from matcher.matcher.album import match_album
from matcher.providers.domain import AlbumType
from tests.matcher.common import MatcherTestUtils


class TestMatchAlbum(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    def test_get_album(self):
        [matches, date, type, genres] = match_album(
            1, "Confessions on a Dancefloor", "Madonna", AlbumType.STUDIO
        )
        # Type
        self.assertIsNone(type)
        # Genres
        self.assertEqual(len(genres), 7)
        self.assertIn("Pop", genres)
        self.assertIn("Dance-Pop", genres)
        self.assertIn("Synth-Pop", genres)
        self.assertIn("Disco", genres)
        self.assertIn("House", genres)
        self.assertIn("Electronic", genres)
        self.assertIn("Euro House", genres)
        # Rating
        self.assertIsNotNone(matches.rating)
        self.assertEqual(matches.rating, 70)
        # Release date
        self.assertIsNotNone(date)
        self.assertEqual(date, datetime.date(2005, 11, 11))
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.album_id, 1)
        ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("Confessions" in str(matches.description))
        self.assertTrue("2005" in str(matches.description))
        ##Sources
        self.assertGreaterEqual(len(matches.sources), 5)
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(
            wiki.url, "https://en.wikipedia.org/wiki/Confessions on a Dance Floor"
        )
        ### Metacritic
        [meta] = [p for p in matches.sources if "metacritic" in p.url]
        self.assertEqual(
            meta.url,
            "https://www.metacritic.com/music/confessions-on-a-dance-floor/madonna",
        )
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/34205")
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in matches.sources if "genius" in p.url]
            self.assertEqual(
                genius.url,
                "https://genius.com/albums/Madonna/Confessions-on-a-dance-floor",
            )
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/122677be-e664-362d-95eb-be3ae126ec03",
        )
        ### Allmusic
        [allmusic] = [p for p in matches.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0000356345")

    def test_get_album2(self):
        [matches, date, type, genres] = match_album(
            1, "The Tortured Poets Department", "Taylor Swift", AlbumType.STUDIO
        )
        # Type
        self.assertIsNone(type)
        # Rating
        self.assertIsNotNone(matches.rating)
        self.assertEqual(matches.rating, 60)
        # Release date
        self.assertIsNotNone(date)
        self.assertEqual(date, datetime.date(2024, 4, 19))
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.album_id, 1)
        # ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("eleventh studio album" in str(matches.description))
        ### Metacritic
        [meta] = [p for p in matches.sources if "metacritic" in p.url]
        self.assertEqual(
            meta.url,
            "https://www.metacritic.com/music/the-tortured-poets-department/taylor-swift",
        )
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(
            wiki.url, "https://en.wikipedia.org/wiki/The Tortured Poets Department"
        )
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/3461018")
        ### Genius
        [genius] = [p for p in matches.sources if "genius" in p.url]
        self.assertEqual(
            genius.url,
            "https://genius.com/albums/Taylor-swift/The-tortured-poets-department",
        )
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/71c3eed6-466c-4aef-ad12-65a36d19467a",
        )
        ### Allmusic
        [allmusic] = [p for p in matches.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0004210541")

    def test_get_album_no_rating(self):
        [matches, date, type, genres] = match_album(1, "Aéromusical", "Superbus", AlbumType.STUDIO)
        # Rating
        self.assertIsNone(matches.rating)
        # Release date
        self.assertIsNotNone(date)
        self.assertEqual(date.month, 3)
        # Matches
        self.assertIsNotNone(matches)
        ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("Aéromusical" in matches.description)
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Aéromusical")
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/426003")
        ### Genius
        [genius] = [p for p in matches.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/albums/Superbus/Aeromusical")
        ### Musicbrainz
        [mb] = [p for p in matches.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/5666a1be-2156-3e94-847b-7bd5cc8b5b93",
        )
        ### Allmusic
        [allmusic] = [p for p in matches.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0000770491")
