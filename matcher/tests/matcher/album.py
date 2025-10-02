import unittest
import datetime
from matcher.matcher.album import match_album
from matcher.providers.domain import AlbumType
from tests.matcher.common import MatcherTestUtils
from matcher.context import Context


class TestMatchAlbum(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    def test_get_album(self):
        res = match_album(1, "Confessions on a Dancefloor", "Madonna", AlbumType.STUDIO)
        # Type
        self.assertIsNone(res.album_type)
        # Genres
        self.assertEqual(len(res.genres), 7)
        self.assertIn("Pop", res.genres)
        self.assertIn("Dance-Pop", res.genres)
        self.assertIn("Synth-Pop", res.genres)
        self.assertIn("Disco", res.genres)
        self.assertIn("House", res.genres)
        self.assertIn("Electronic", res.genres)
        self.assertIn("Euro House", res.genres)
        # Rating
        self.assertIsNotNone(res.metadata.rating)
        self.assertEqual(res.metadata.rating, 70)
        # Release date
        self.assertIsNotNone(res.release_date)
        self.assertEqual(res.release_date, datetime.date(2005, 11, 11))
        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.album_id, 1)
        ##Description
        self.assertIsNotNone(res.metadata.description)
        self.assertTrue("Confessions" in str(res.metadata.description))
        self.assertTrue("2005" in str(res.metadata.description))
        ##Sources
        self.assertGreaterEqual(len(res.metadata.sources), 5)
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        self.assertEqual(
            wiki.url, "https://en.wikipedia.org/wiki/Confessions on a Dance Floor"
        )
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        self.assertEqual(
            meta.url,
            "https://www.metacritic.com/music/confessions-on-a-dance-floor/madonna",
        )
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/34205")
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            self.assertEqual(
                genius.url,
                "https://genius.com/albums/Madonna/Confessions-on-a-dance-floor",
            )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/122677be-e664-362d-95eb-be3ae126ec03",
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0000356345")

    def test_get_album2(self):
        res = match_album(
            1, "The Tortured Poets Department", "Taylor Swift", AlbumType.STUDIO
        )
        # Type
        self.assertIsNone(res.album_type)
        # Rating
        self.assertIsNotNone(res.metadata.rating)
        self.assertEqual(res.metadata.rating, 60)
        # Release date
        self.assertIsNotNone(res.release_date)
        self.assertEqual(res.release_date, datetime.date(2024, 4, 19))
        # Matches
        self.assertIsNotNone(res.metadata)
        self.assertEqual(res.metadata.album_id, 1)
        # ##Description
        self.assertIsNotNone(res.metadata.description)
        self.assertTrue("eleventh studio album" in str(res.metadata.description))
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        self.assertEqual(
            meta.url,
            "https://www.metacritic.com/music/the-tortured-poets-department/taylor-swift",
        )
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        self.assertEqual(
            wiki.url, "https://en.wikipedia.org/wiki/The Tortured Poets Department"
        )
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/3461018")
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        self.assertEqual(
            genius.url,
            "https://genius.com/albums/Taylor-swift/The-tortured-poets-department",
        )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/71c3eed6-466c-4aef-ad12-65a36d19467a",
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0004210541")

    def test_get_album_no_rating(self):
        res = match_album(1, "Aéromusical", "Superbus", AlbumType.STUDIO)
        # Rating
        self.assertIsNone(res.metadata.rating)
        # Release date
        self.assertIsNotNone(res.release_date)
        self.assertEqual(res.release_date.month, 3)
        # Matches
        self.assertIsNotNone(res.metadata)
        ##Description
        self.assertIsNotNone(res.metadata.description)
        self.assertTrue("Aéromusical" in res.metadata.description)
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        self.assertEqual(wiki.url, "https://en.wikipedia.org/wiki/Aéromusical")
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/426003")
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        self.assertEqual(genius.url, "https://genius.com/albums/Superbus/Aeromusical")
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        self.assertEqual(
            mb.url,
            "https://musicbrainz.org/release-group/5666a1be-2156-3e94-847b-7bd5cc8b5b93",
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        self.assertEqual(allmusic.url, "https://www.allmusic.com/album/mw0000770491")

    def test_get_album_ignore_genres(self):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = match_album(1, "Confessions on a Dancefloor", "Madonna", AlbumType.STUDIO)
        # Teardown
        context.settings.push_genres = True
        # Genres
        self.assertEqual(len(res.genres), 0)

    def test_get_album_correct_type(self):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = match_album(1, "(How to Live) as Ghosts", "10 Years", AlbumType.LIVE)
        # Teardown
        context.settings.push_genres = True
        self.assertEqual(res.album_type, AlbumType.STUDIO)
