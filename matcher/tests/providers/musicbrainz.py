from typing import List
import unittest
import datetime
from matcher.context import Context
from matcher.providers.domain import AlbumType
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
        artist1 = provider.search_artist("Christine & The Queens")
        artist2 = provider.search_artist("Christine and The Queens")
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

    def test_search_album_compilation_formatted_name(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("GHV2 (Greatest Hits, Volume. 2)", "Madonna")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "a0aa8b0a-5e10-3627-afde-7235b86042f6")  # pyright:ignore

    def test_search_single(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = provider.search_album("Protection - Single", "Massive Attack")
        self.assertIsNotNone(album)
        self.assertEqual(album.id, "751030cb-44c8-3542-8e75-42b3e4f820fa")  # pyright:ignore

    def test_get_album_release_date_and_genres_and_type(self):
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
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.STUDIO, type)

    def test_get_album_type_remix(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Massive Attack - No Protection
        album = provider.get_album("54bd7d44-86e1-3e3c-82e0-10febdedcbda")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.REMIXES, type)

    def test_get_album_type_remix_2(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Girls Aloud - Mixed Up
        album = provider.get_album("ce018797-8764-34f8-aee4-10089fc7393d")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.REMIXES, type)

    def test_get_album_type_remix_3(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Madonna - You Can Dance
        album = provider.get_album("a70bd0f3-2af4-3fb0-b4af-d94b0c3a882f")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.REMIXES, type)

    def test_get_album_type_remix_4(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Sneaker Pimps - Becoming remixed
        album = provider.get_album("20e4a61b-218b-3e1f-9d12-6a4a2dd44425")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.REMIXES, type)

    def test_get_album_type_compilation(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Madonna - Celebration
        album = provider.get_album("bd252c17-ff32-4369-8e73-4d0a65a316bd")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.COMPILATION, type)

    def test_get_album_type_compilation_2(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Girls Aloud - Ten
        album = provider.get_album("3d22d747-fada-49f5-b649-ca1901beb3f2")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.COMPILATION, type)

    def test_get_album_type_compilation_3(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Garbage Anthology
        album = provider.get_album("6dbee52b-146d-45ba-86d4-f0156824088b")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.COMPILATION, type)

    def test_get_album_type_compilation_4(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Moloko Catalogue
        album = provider.get_album("35f99662-c0e7-3ddc-a321-ad2da346cb83")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.COMPILATION, type)

    def test_get_album_type_compilation_unofficial(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        # Britney Spears - Can you handle mine
        album = provider.get_album("8795e66f-3746-3892-b160-917647350d15")
        self.assertIsNotNone(album)
        type = provider.get_album_type(album)
        self.assertIs(AlbumType.COMPILATION, type)

    def test_search_song(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = provider.search_song("Breathe On Me", "Britney Spears", [])
        self.assertIsNotNone(song)
        self.assertEqual("08d07438-9b9c-4c41-a1d5-7211a32cc9ad", song.id)  # pyright: ignore

    def test_search_song_special_char(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = provider.search_song("100%", "Moloko", [])
        self.assertIsNotNone(song)
        self.assertEqual("13f48782-ca5a-4a7f-9623-f1054697c173", song.id)  # pyright: ignore

    def test_search_song_solo(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = provider.search_song("E.T.", "Katy Perry", [])
        self.assertIsNotNone(song)
        self.assertIn(
            song.id,  # pyright: ignore
            [
                "59025ade-1476-466e-bff4-7a20a6e296b8",
                "a0ad9828-ff96-42d0-b7a5-d0e85ec001c2",
            ],
        )

    def test_search_song_feat(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = provider.search_song("E.T.", "Katy Perry", ["Kanye West"])
        self.assertIsNotNone(song)
        self.assertEqual("a53fe01d-5c2d-4c71-9684-9ef814df9c9b", song.id)  # pyright: ignore
