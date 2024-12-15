from typing import List
import unittest
import datetime
from matcher.context import Context
from matcher.providers.musicbrainz import MusicBrainzProvider
from tests.matcher.common import MatcherTestUtils


class TestMusicbrainz(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_search_artist(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist = provider.search_artist("P!nk")
        self.assertIsNotNone(artist)
        self.assertEqual(artist.id, "f4d5cc07-3bc9-4836-9b15-88a08359bc63")  # pyright:ignore

    def test_search_artist_with_alias(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist1 = provider.search_artist("Christine & The Queen")
        artist2 = provider.search_artist("Christine and The Queen")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "9c90ffbf-b137-4dee-bfcc-b8010787840d")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_search_artist_with_and(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist1 = provider.search_artist("Florence + The Machine")
        artist2 = provider.search_artist("Florence and the machine")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "5fee3020-513b-48c2-b1f7-4681b01db0c6")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_search_artist_with_and_2(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist1 = provider.search_artist("Selena Gomez & The Scene")
        artist2 = provider.search_artist("Selena Gomez and the Scene")
        self.assertIsNotNone(artist1)
        self.assertIsNotNone(artist2)
        self.assertEqual(artist1.id, "37d0a847-32d3-480f-bd1e-101f50a3d332")  # pyright:ignore
        self.assertEqual(artist2.id, artist1.id)  # pyright:ignore

    def test_get_artist(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist = provider.get_artist("45a663b5-b1cb-4a91-bff6-2bef7bbfdd76")
        self.assertIsNotNone(artist)
        self.assertEqual(artist["name"], "Britney Spears")  # pyright:ignore

    def test_search_album(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Protection", "Massive Attack")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "ded46e46-788d-3c1f-b21b-9f5e9c37b1bc")  # pyright:ignore

    def test_search_album_correct_year(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Revolution In Me", "Siobhan Donaghy")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "80f800d3-8dd0-3f69-8ddd-fc1e42c55d4c")  # pyright:ignore

    def test_search_album_special_char(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("M!ssundaztood", "P!nk")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "1000b015-e841-3cc4-ab5b-f47931f574e3")  # pyright:ignore

    def test_search_album_and_fail(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Volumen Plus", "Björk")
        self.assertIsNone(album)

    def test_search_album_not_single(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Celebration", "Madonna")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "bd252c17-ff32-4369-8e73-4d0a65a316bd")  # pyright:ignore

    def test_search_single(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Protection - Single", "Massive Attack")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "751030cb-44c8-3542-8e75-42b3e4f820fa")  # pyright:ignore

    def test_get_album_release_date_and_genres(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.get_album("ded46e46-788d-3c1f-b21b-9f5e9c37b1bc")
        self.assertIsNotNone(album)
        release_date = provider.get_album_release_date(album)
        self.assertEqual(release_date, datetime.date(1994, 9, 26))
        genres: List[str] = provider.get_album_genres(album)  # pyright: ignore
        self.assertEqual(len(genres), 6)
        self.assertIn("Trip Hop", genres)
        self.assertIn("Electronic", genres)
        self.assertIn("Dub", genres)
        self.assertIn("Downtempo", genres)
        self.assertIn("Alternative Dance", genres)
        self.assertIn("Electronica", genres)
