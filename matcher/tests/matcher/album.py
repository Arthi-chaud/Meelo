import os
import unittest
import datetime
from matcher.matcher.album import match_album
from tests.matcher.common import MatcherTestUtils


class TestMatchAlbum(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        return MatcherTestUtils.setup_context()

    # TODO Test album where rating on allmusic is 0
    # TODO Test compilation
    # TODO Test album where rating from metacritic
    # TODO Test where an album has the same name as a song
    # TODO Test a compilation album does not get mixed up with a single

    def test_get_album(self):
        [matches, date] = match_album(1, "Confessions on a Dancefloor", "Madonna")
        print(matches.sources)
        # Release date
        self.assertIsNotNone(date)
        self.assertEqual(date, datetime.date(2005, 11, 11))
        # Matches
        self.assertIsNotNone(matches)
        self.assertEqual(matches.album_id, 1)
        # ##Description
        self.assertIsNotNone(matches.description)
        self.assertTrue("Confessions" in str(matches.description))
        self.assertTrue("2005" in str(matches.description))
        # ##Sources
        # self.assertEqual(len(matches.sources), 6)
        ### Wikipedia
        [wiki] = [p for p in matches.sources if "wiki" in p.url]
        self.assertEqual(
            wiki.url, "https://en.wikipedia.org/wiki/Confessions on a Dance Floor"
        )
        ### Discogs
        [discogs] = [p for p in matches.sources if "discogs" in p.url]
        self.assertEqual(discogs.url, "https://www.discogs.com/master/34205")
        ### Genius
        [genius] = [p for p in matches.sources if "genius" in p.url]
        self.assertEqual(
            genius.url, "https://genius.com/albums/Madonna/Confessions-on-a-dance-floor"
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
