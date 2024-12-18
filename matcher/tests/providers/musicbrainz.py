from typing import List, Tuple
import unittest
import datetime
from matcher.context import Context
from matcher.providers.domain import AlbumSearchResult, AlbumType, ArtistSearchResult
from matcher.providers.musicbrainz import MusicBrainzProvider
from tests.matcher.common import MatcherTestUtils


class TestMusicbrainz(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    def test_search_artist(self):
        scenarios: List[Tuple[str, str]] = [
            ("P!nk", "f4d5cc07-3bc9-4836-9b15-88a08359bc63"),
            ("Christine & The Queens", "9c90ffbf-b137-4dee-bfcc-b8010787840d"),
            ("Christine and The Queens", "9c90ffbf-b137-4dee-bfcc-b8010787840d"),
            ("Florence + The Machine", "5fee3020-513b-48c2-b1f7-4681b01db0c6"),
            ("Florence and The Machine", "5fee3020-513b-48c2-b1f7-4681b01db0c6"),
            ("Selena Gomez & The Scene", "37d0a847-32d3-480f-bd1e-101f50a3d332"),
            ("Selena Gomez and the Scene", "37d0a847-32d3-480f-bd1e-101f50a3d332"),
        ]

        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore

        for [artist_name, expected] in scenarios:
            with self.subTest("Search Artist", artist_name=artist_name):
                artist: ArtistSearchResult = provider.search_artist(artist_name)  # pyright: ignore
                self.assertIsNotNone(artist)
                self.assertEqual(artist.id, expected)

    def test_get_artist(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist = provider.get_artist("45a663b5-b1cb-4a91-bff6-2bef7bbfdd76")
        self.assertIsNotNone(artist)
        self.assertEqual(artist["name"], "Britney Spears")  # pyright:ignore

    def test_search_album(self):
        scenarios: List[Tuple[str, str | None, str | None]] = [
            ("Nova Tunes 01", None, "a6875c2b-3fc2-34b2-9eb6-3b73578a8ea8"),
            ("Protection", "Massive Attack", "ded46e46-788d-3c1f-b21b-9f5e9c37b1bc"),
            (
                "Revolution In Me",
                "Siobhan Donaghy",
                "80f800d3-8dd0-3f69-8ddd-fc1e42c55d4c",
            ),
            ("M!ssundaztood", "P!nk", "1000b015-e841-3cc4-ab5b-f47931f574e3"),
            ("Volumen Plus", "Björk", None),
            ("Celebration", "Madonna", "bd252c17-ff32-4369-8e73-4d0a65a316bd"),
            (
                "GHV2 (Greatest Hits, Volume. 2)",
                "Madonna",
                "a0aa8b0a-5e10-3627-afde-7235b86042f6",
            ),
            (
                "Protection - Single",
                "Massive Attack",
                "751030cb-44c8-3542-8e75-42b3e4f820fa",
            ),
        ]

        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore

        for [album_name, artist_name, expected] in scenarios:
            with self.subTest(
                "Search Album", album_name=album_name, artist_name=artist_name
            ):
                album: AlbumSearchResult = provider.search_album(
                    album_name, artist_name
                )  # pyright: ignore
                if not expected:
                    self.assertIsNone(album)
                else:
                    self.assertIsNotNone(album)
                    self.assertEqual(album.id, expected)

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

    def test_get_album_type(self):
        scenarios: List[Tuple[str, AlbumType]] = [
            # Massive Attack - No Protection
            ("54bd7d44-86e1-3e3c-82e0-10febdedcbda", AlbumType.REMIXES),
            # Girls Aloud - Mixed Up
            ("ce018797-8764-34f8-aee4-10089fc7393d", AlbumType.REMIXES),
            # Madonna - You Can Dance
            ("a70bd0f3-2af4-3fb0-b4af-d94b0c3a882f", AlbumType.REMIXES),
            # Sneaker Pimps - Becoming remixed
            ("20e4a61b-218b-3e1f-9d12-6a4a2dd44425", AlbumType.REMIXES),
            # Madonna - Celebration
            ("bd252c17-ff32-4369-8e73-4d0a65a316bd", AlbumType.COMPILATION),
            # Girls Aloud - Ten
            ("3d22d747-fada-49f5-b649-ca1901beb3f2", AlbumType.COMPILATION),
            # Garbage - Anthology
            ("6dbee52b-146d-45ba-86d4-f0156824088b", AlbumType.COMPILATION),
            # Moloko - Catalogue
            ("35f99662-c0e7-3ddc-a321-ad2da346cb83", AlbumType.COMPILATION),
            # Britney Spears - Can you handle mine
            ("8795e66f-3746-3892-b160-917647350d15", AlbumType.COMPILATION),
        ]

        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        for [mbid, expected_type] in scenarios:
            with self.subTest("Get Album Type", mbid=mbid, type=expected_type):
                album = provider.get_album(mbid)
                self.assertIsNotNone(album)
                type = provider.get_album_type(album)
                self.assertIs(expected_type, type)

    def test_search_song(self):
        scenarios: List[Tuple[str, str, List[str], List[str]]] = [
            (
                "Breathe On Me",
                "Britney Spears",
                [],
                ["08d07438-9b9c-4c41-a1d5-7211a32cc9ad"],
            ),
            ("100%", "Moloko", [], ["13f48782-ca5a-4a7f-9623-f1054697c173"]),
            (
                "E.T.",
                "Katy Perry",
                [],
                [
                    "59025ade-1476-466e-bff4-7a20a6e296b8",
                    "a0ad9828-ff96-42d0-b7a5-d0e85ec001c2",
                ],
            ),
            (
                "E.T.",
                "Katy Perry",
                ["Kanye West"],
                ["a53fe01d-5c2d-4c71-9684-9ef814df9c9b"],
            ),
        ]
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore

        for [song_name, artist_name, featuring, expected] in scenarios:
            with self.subTest("Search Song", song_name=song_name, featuring=featuring):
                song = provider.search_song(song_name, artist_name, featuring)
                self.assertIsNotNone(song)
                self.assertIn(song.id, expected)  # pyright: ignore

    def test_get_song_with_genres(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = provider.get_song("08d07438-9b9c-4c41-a1d5-7211a32cc9ad")
        self.assertIsNotNone(song)
        self.assertEqual(song["title"], "Breathe on Me")  # pyright:ignore
        genres: List[str] = provider.get_song_genres(song)  # pyright: ignore
        self.assertIsNotNone(genres)
        self.assertIn("Pop", genres)
        self.assertIn("Dance-Pop", genres)
        self.assertIn("Electro", genres)
        self.assertIn("Synth-Pop", genres)
        self.assertIn("Ballad", genres)
