from typing import List, Tuple
import unittest
import datetime
from matcher.context import Context
from matcher.providers.domain import AlbumType, SearchResult
from matcher.providers.musicbrainz import MusicBrainzProvider
from tests.matcher.common import MatcherTestUtils


class TestMusicbrainz(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        MatcherTestUtils.setup_context()

    async def test_search_artist(self):
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
                artist: SearchResult = await provider.search_artist(artist_name)  # pyright: ignore
                self.assertIsNotNone(artist)
                self.assertEqual(artist.id, expected)

    async def test_get_artist(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        artist = await provider.get_artist("45a663b5-b1cb-4a91-bff6-2bef7bbfdd76")
        self.assertIsNotNone(artist)
        self.assertEqual(artist["name"], "Britney Spears")  # pyright:ignore

    async def test_search_album(self):
        scenarios: List[Tuple[str, str | None, str | None]] = [
            ("Nova Tunes 01", None, "a6875c2b-3fc2-34b2-9eb6-3b73578a8ea8"),
            # Test when is not actually various artist, but has type 'compilation'
            ("Hotel Costes, Vol. 4", None, "ff53e2aa-5b80-3f67-b1d1-2e22582af2c2"),
            ("Hotel Costes, Volume 4", None, "ff53e2aa-5b80-3f67-b1d1-2e22582af2c2"),
            ("Hotel Costes: Best Of...", None, "16b9cdb4-1219-3bde-b538-b33fbf5d0626"),
            # Test when is not actually various artist, but has type 'Soundtrack'
            (
                "Challengers: Original Score",
                None,
                "5f2a4d8a-3511-4656-9c9a-0ad5c604a421",
            ),
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
                "GHV2 (Greatest Hits, Volume 2)",
                "Madonna",
                "a0aa8b0a-5e10-3627-afde-7235b86042f6",
            ),
            ## Test handling of 'vol.' acronyms
            (
                "GHV2 (Greatest Hits, Vol. 2)",
                "Madonna",
                "a0aa8b0a-5e10-3627-afde-7235b86042f6",
            ),
            ## Test handling of '(Remixes)' Suffix
            (
                "Love Profusion (Remixes)",
                "Madonna",
                "618ac790-9456-3c5b-80ff-94a341c51aba",
            ),
            (
                "American Life (Remixes)",
                "Madonna",
                "2db09a30-3e77-3ada-ab03-5b9bff66c8a8",
            ),
            (
                "Protection - Single",
                "Massive Attack",
                "751030cb-44c8-3542-8e75-42b3e4f820fa",
            ),
            # Handle '&'
            (
                "Sampladelic Relics And Dancefloor Oddities",
                "Deee-Lite",
                "3709277b-0466-325c-a822-d919133c88ee",
            ),
            (
                "Sampladelic Relics & Dancefloor Oddities",
                "Deee-Lite",
                "3709277b-0466-325c-a822-d919133c88ee",
            ),
        ]

        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore

        for [album_name, artist_name, expected] in scenarios:
            with self.subTest(
                "Search Album", album_name=album_name, artist_name=artist_name
            ):
                album: SearchResult = await provider.search_album(
                    album_name, artist_name
                )  # pyright: ignore
                if not expected:
                    self.assertIsNone(album)
                else:
                    self.assertIsNotNone(album)
                    self.assertEqual(album.id, expected)

    async def test_get_album_release_date_and_genres_and_type(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = await provider.get_album("ded46e46-788d-3c1f-b21b-9f5e9c37b1bc")
        self.assertIsNotNone(album)
        release_date = await provider.get_album_release_date(album)
        self.assertEqual(release_date, datetime.date(1994, 9, 26))
        genres: List[str] = await provider.get_album_genres(album)  # pyright: ignore
        self.assertEqual(len(genres), 6)
        self.assertIn("Trip Hop", genres)
        self.assertIn("Electronic", genres)
        self.assertIn("Dub", genres)
        self.assertIn("Downtempo", genres)
        self.assertIn("Alternative Dance", genres)
        self.assertIn("Electronica", genres)
        type = await provider.get_album_type(album)
        self.assertIs(AlbumType.STUDIO, type)

    async def test_get_album_release_date_month_only(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        album = await provider.get_album("88f4aea6-617a-305b-ab3d-9433dc2d5c6f")
        self.assertIsNotNone(album)
        release_date = await provider.get_album_release_date(album)
        self.assertEqual(release_date, datetime.date(1994, 11, 1))

    async def test_get_album_type(self):
        scenarios: List[Tuple[str, AlbumType]] = [
            # Madonna - I'm Going to tell you a secret
            ("876da970-473b-3a01-9aea-79d1fa6b053a", AlbumType.LIVE),
            # Madonna - Finally Enough Love
            ("7316f52d-7421-43af-b9e8-02e1cab17153", AlbumType.REMIXES),
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
            # Lady Gaga - Fame Monster
            ("20b4c8b3-e922-44a3-90e8-fa00acad8ed4", AlbumType.EP),
            # Britney Spears - Chaotic
            ("e19ae891-315c-45ed-a643-eba4f52e8554", AlbumType.EP),
            # Britney Spears - In the zone (album, not EP)
            ("add6cf16-f4c1-3d50-9b28-633b35ca8189", AlbumType.STUDIO),
        ]

        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        for [mbid, expected_type] in scenarios:
            with self.subTest("Get Album Type", mbid=mbid, type=expected_type):
                album = await provider.get_album(mbid)
                self.assertIsNotNone(album)
                type = await provider.get_album_type(album)
                self.assertIs(expected_type, type)

    async def test_search_song(self):
        scenarios: List[Tuple[str, str, List[str], List[str]]] = [
            (
                "Breathe On Me",
                "Britney Spears",
                [],
                [
                    "08d07438-9b9c-4c41-a1d5-7211a32cc9ad",
                    "a3522de9-4682-486d-9117-29fca7fabb55",
                ],
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
                song = await provider.search_song(
                    song_name, artist_name, featuring, None
                )
                self.assertIsNotNone(song)
                self.assertIn(song.id, expected)  # pyright: ignore

    async def test_search_song_with_acoustid(self):
        scenarios: List[Tuple[str, str, int, List[str]]] = [
            (
                "Hung Up",
                "AQADtEnEJEokRYsCUyke-PBx_PDh4ziOHz9s44f444cPH_eR98ORGxf05_iEn-iXozh-aD9KLsGF3DPuwy9-Bn9gxii7eESPNwc_INmPmEqs43GoJOj042henIrxK0LVZEbjgBeu_fhx_Wiig1GO8NARdsdLPPvx5ejR7MGXHy9-gXmK_8hMiCfCX2jCF1114w6YozlOhQpxoTI9NM9-NOXQH73QXPnxo-KRJiUhqeKRXj3aKcmE68FbhNmhIT_Oo_twFM9Qnh3a6EGW5Uj4LBX64y96wjnh4WN0NF3wkEa-MB2kVMmOPA6u-PCLd4ejvsIpHVQTVMTxq8KZVsgepkObe_Ah5jQ-_KjjQt4PP-NwfMTx48tyND9KKUSd1EjHfGieI-fR41uKVi8eHe6hT_jBcAkeHu2Ck7gPvSoaZkLeGT76o-TRcIyRH3JYhBbOwDGP48W1HKF24s1xBlqo5OCdDXmMy3DiWDg8jTrqBD-OX7ijVbjSKkKWhvCP8-DxQIvG1Xg--BmOH5-O73izoOGPWhlKJYzh5_CeC73Q_HC3VOhzXLD24hP45NBufDz6o8fxxchTBf7hB_3RXwgjjcEfaEeOFyc88sIRfsS1HNd-9DRESjv4Ix_xB1cH54U7HleCCsc14s1xJTvaGNbx0PiOHC7RRxZEZjt-fPhxe3h4NNWE8MnRVAzaJUcfF5Z33Li2HOXy4vCRXcGlob8U6MezFz_u4VWRR0iJw5cC_-hFQo_RPEF_4Tj1oM-D49MNbXPwIUuO_pgcfXCpGD98_Tj-o06O68efoOQxfcGT3aj9wOPR_PiQo0wKcUuOHm92gG2O58h9MGRy2PrhOiiro60uHOWNWkfjh0CYM2Ae4UTdSYLua-CzI8dR_ZicWkHT4fiWo0-EWstxDVfQjiSa78hL9BCrCR_S-bC8fDhO5EcPLVRz9DPyTR-aLziOtUOvBJeEL67RNzhsI_zx6NDy49iOy8J3lJF0HP2hxTme43FwBv3RVMVz6N8KH0c9ZfAJjfqEc8f1oSd8DT_a9Ao-tIdT4ZnhGFc04cwHzT26EA0v_MOJbmLQSz56XfCWkAx66ONx_AizW0V_XIpyNCNRNJqiI2ieS8KF70Qf40sMS0e55OhbuMqhG4d14S_KLMGjSsU1wc8Cfbh2hJ0EOz2FHpdGdFl-hPlQj9ByCfpxfcKZa8gvo8eP5_CJsINqDe2i4MeTwscfWEfOo-nxRij_wUdDf0MeZkF9wtAT4Sz6I1-O3hWe4xVc8ehS9GieI4f2w-senKoDbyl04sNhGx-H9MOLZn2Q7zil-GgOnQp-ow9K9miuHPJROUcYHu9QHj4qPcV1Bbm0ozn0Es2PXImMPvhx64GP8FNQShx09Aij5-iiDTkvPCSaB92Uod_QOQq0HJqHa4dH3lANPceLWhqaqD_O4z_SRzg87cXbo3J4NEc-3Du66BAc9-hTVLdwKUKnqUX5wR_RH19xZmj0C33wHaozHx6RH4WvGb2N90H8HU1VB9p3vEEtBlYTtHrwoGeExiEuDqUWHe8g0sIk_fiCH80v9MX8I092XMevB31xBdfR3MgF1TzeIHpX_D3CRxgp6YGeF2l-lDy-o8uSHM7VI_3xQ9zRIx-LajdxpIoLP4ImLlMRVytxHuYePNPxEueO-4Rp5A50SmjiREceKfhxGj45lA_CUFEbdDn6Q4t1I9STEE034kV_eBaq8SqeS0OOU2Gg5UfvQn-JR3nR_fDzHL6GPhG6SYYP8Yc4MhXaxcQPvcET-MbFQ1_z4MkSPDuq6kGOO0F61Id-SrgWKniFe5gOPyzE7thzNPKNE5-So1xjQ8-GG2Hy4ziDNpKOPBd-iNcRKf9wjcJ_eEue4D3CZ4PahkGv48f0Y0qu4-Uh68eNi0GYu-hZzGuOhzne446OnimuCP8Qpjd0xKbxHKt6_CH6HdHCRekg-kWaBz3OoEumB28mBuHz4od2NDvyHUe1I1U84ZGgpctU5Ovx5fD4ED_OMDiVHT8858izQo8k9FmONLrRXcKNPhrhB7niBlbSQ5xQPWQwOU3hKySK5g_K48tw0RL-4z2aSwjV5ngfPBEq__iDXtlxRUF-aD_SPqjEsPjGGI-NI1dkoVcOLRVz5PyCJwvu43lwJcMz9CaaJQ9u5GFmHPo3hLoa8AyoUy1C_sFx7cfzBP2CE89jpKyL6UXlKBkjXEePB48_5F0cnB60Z0ifBaeOL7qIR8dPoWdw4RdqBw3HC_nxQcvg4k2J9DyO4xLCH_2hhRKL3DrqDdYD_8V1TPlxSR_y3Lg69CFeNGKOo5J0bMcfwc-F9-iSxTh1_GiO7scfPAp-uD70LMJV-Md19IMuHf6EdsERekeKawm8w9qEPzAVPAr8oT0-ZQ90oQvREJeLF_WFXvnwo3mGLiQOfcdvlD_CbFdx5WiHZjr6Hf6LVJ7R5wmuL-hDnIF5dOGJi0XT7cAhqhcAKpQDSChnnTAOOKkEAEooIoClEAihnCGCAEoIAwABShCzChkAhAAOACAYQoA4wwQRhANBGAAIOACAEMAxBAQSABigABAACKEIAYAhRQhBhghBAJDMCSOAMEgIAIQQRCIDhCCOqGYIAAAAZhAATJLGjKBEIUaQQkxAh5hRggllhCJEQOMAI0oAgRgDSsIBqWoGEECNIV4JYJgRxighHFACESQAQ44JIowgSjlHBEGECCSEMo4ARxQRBggBGBPESUYwGIoQzIxRATAjDETMASSVoEQohpASQkAGBBGIkQiQEIYATIwwnhAnCQGCCCAsAIASg4AxBBGBhGHqMOGIcYYIBIASQzFAiBBESIoABwQBhQQRwhFhjhSEEWEEkpcY4AQSABiGmCCCKGEFNQQLJhFAFgBDICHAKYGkM8QY4QwBwAAliCNEAGyIFEIkpIgwghLGGBIiKGIEYUYIgRwBhgBDAGJGUMCUU5IYQABAABBEGBMIOMggEgIQKoACRAiJCCJAEIaQE0ISzjQWThggEQJGKSQEB8oQRIywiiomEFEIOCQEESAAABRRxiIlCEXCQgKBMEgoZRQxgAgmFBOCECEQQIIAQYBiAgAgFHHOAwGIEEIYYBgxhhAgEERSGQECUUYQBhBBBggpJBOAG2EIOYgIAREABAgCoAAEAIAJIoowpAAAQgFCAYZACEYwQE4gAggiQ1BCgKNAAECIAYQII4hDThFiCACAIEEEMcIAIRSRBDTDiBBEGEEEEAgiLQwRjQlikHFEAMYEkUIAoSgwxgBBjDBAAIIAAAQRAxwxBAEAmANCHCCAIAIYRpAyDgBNgCBCCAMEcoAwAQEjmBojmACAEcGEIEIxAxhwRCBBDUHKCUYEcwgoIhQygiFrAAAAIEEMdQAgIgwJAIHkJCGIKBKFINAJQASRBBBAjWAKGEEYUkAKKQQhSACCgHJIAA",
                338,
                ["d63f9a2c-aea5-4b77-875e-eee7ce1fd734"],
            ),
            (
                "Overrated (Radio Edit)",
                "AQADtNKiJJEkRUqCcBe0xNKPT0qK77huaJx6_MiP40dzBbdxlsjVQ2NJNMFz5PlR4qkVHD7RD_8RG0c3x3B9hLKFXheaPjjS4_mgI-eExhqOpteRo1aEJt3x7agEk6dwo3Y26Eu-IN_gZ8SeqMcT_EGV8YObC0d-QQrJbcjzCMfB-HCajCN2PWjmFj2aHFeiIGbiAZ1ZmIf2IBdztFJUNG2Oi7iOH6H9QBRzIe2Ww79Q5gpuHUdXCg6VpYN9hNTRLiOas8cl7fiyZ0VeNHFQPsXvIxcpXEkeiD-eCNHxFzmTHFqT6Kh05J9RpS-al_hxecifQ98e1Jo-iE-OPCeabniEUl-CJq-k4MH38EhmJgizCZfxPAETNQyHC_4R-qiqYYpeXLjyw7OMH-PDSEKizAwm4Wnw5ziaHz1_PNFzJJ2SHLkuoQ9d-OjzCXelIdJ2JFqP89hxGm7QT8eVRU6ERjlVJDsiXULzBMxK55gS5hyu4zvyQ7yJH5_WQZWSzMhT9Edzc8TDLXgRkTmkKLuJPMuOfXCFOmaMPBe0PwzS_PBjTAeTKDQi8UHyBFcenBKac6huPHKIT4paDbkKvXCeHlcu6B--Iy4myjTa1SiVEk2XIl9y_BqhozuLpnqgZ8EuSrhOfNB34lPw1-ijEs3xQnU-hHkPKwuNPsc6G32UCM1cATmNejT8E2nS9miHr7iI6Mnx44twXULFH5vwRiMkc8jhv8L05WiFxvjw_eglwVF1WLkRqpoMfUcutGrQfD52XcgO5S_64AophHiyIz9uRReSPYePZhKPL9GN-QqewzK5ZODF4YyCS1JQ-Cn2Ia1y4bOKNGlRi8ejYn9xJeAbXMmFyTIc08KDH5H6Qx94IZeSF72wuziNX6iO-_j0o_rxY3ckpAVz4dGS4k-InkdTfA0-BY-O6pmgH3mSw_nBUFt2XKrBak9wH1TN4ulYPM2OS4mio4mXIjRRPYUpPUid8HhKG2108A-e41txCnuCR7UwIV5-WOWhSbuEvOCVowyPf5j-43iKZsdYKTIafUashjt0Iz8aawHzB3mO_YQeXCGL48d7fIf66AgvnnjRxvh0_Cn6LMeU_MFluXiSaHgWNFyP7x0ccxm4JrjI48lB_cWXoZ_wkML-G1-y4zsqybDaHj_qrcjzCheUK0b46AIT4t3w2COa6kIffLPx1CFO6Uh2BllS3XiJZ3OK_5iu8EGYQz9eI0eVD15jFb-Gb8LUWcgP_UEeioOrBv-OI4kkSRGaTBtydLnQKMxxqTrCrMwnJJPDKcWND5UjoaTwRMfjRahtNI-O6wZyHYoi3QjJ5Og5-MS07cEbHTmzCGViHlqOfxGaH9pzxJoOSzzu48h16EqC2DhxjdGCi5kFp8eVIW8_HOKImAqV45jiJN2KUH6GH1-iCFaWDOcXTDeaZzkuolYOLVtyId4uPKLw4BeaSZvRVcqM30MO7Vl6WIpxhKdxMRyOJpSuIomWJUf8Cz-aWUH_BVcOJo-QKEf8JUSXZNExZQt55IyK_hA_hPtRKrnw5Q3SqIdu5NaEWse740obNPGNycaZRDliakeynmiqmMHFD9yjlcKPSFG0CRo7I7fxKJVU7Mgh-0eoh2BSCk9xe9hfXI-QykdyXfhxNXjsB010B4-QHxrljIjY48c1gRGXodEX5NKhH5eyaHiBRMlzdE_i4hTm4aKFvrBeJOuR07iW49KF_2jUJaioHEk-ZMclDbvwWMeUuELYHV-ULYGefDj4QZMTDdGSMuiBHz9T9Dka90iq_sgnonmKnkR-oWuWEaqF_Jh-XJyYID-0yJkQqsdZ7OOE2NwOmRtiLzdKKREaHj_eJviO8IWWfM-QR1Px6UGVmcKPHo-yHCF5NL6gI8wZ9MlwHZ3iDIePXseRZzrUdccRHn7QRuGL3kfzGHuNJj_CTZSgtkGWDv_RJ0mFKxf2B02OSGzl4rkIjUtIwcepzIdYFeEDVr9x_biFPXlwSUeeXcOkR5DE8QiP6w72w5SN84ZxvfiJSzxSJdMmQVcUhIkZGb0iEufxo3GKNluPYz-IXOOHQ8VK5JKJWGKOsoN4omF87I8oxNJmMO84NDr2TDs-Kcb1HM0_PCHMKEd-qFv2wXo4aGqy4r-wLzRyKgNv7GEoXDkq_rh2Cs7Rv9h15PogXTrCJ9hr_PjooPfxPRWOT8dzYXwOV2DXDI_o4L0EP8czDXluXFqOxwn0ysKVIz-aJNLBqFqIR6SCE0VT79gV5TiDPyca-UWeLMKjHA85vEEcz8RU_eCPi8fe49YTPOGRz2iSQ-HGo_-QHd_RLM-D_WiO7_hZlDmaSMsQniO0yMsR4xamSgvR9McvZD5-KFdwn8hZ4kNRbkdoKYfvQ__RZNlIIX-CNVLmo3oGJvXxJVFwKR-e8UHzasd-uMoqPEdPCvuN_vBzMJdiCpew48lxH53uDT_8I3yyY9chIdcboXly7A98_Ap64YtM4YhaJKWSsPh0UGNl4pxxLQ_2IT10ETn64rtCWOnR66grpLNKiFmOkDse3EzhH-dxLUd_5NTxwxeJH08p_KhF4hr64IGfHOkXolfwfsSnB_eHG2EY9dC-I__w4MqNnQ8eJdNwHwejyx6YvDlyD817aCepof9gjjKhnSGwC2F5pCOD5oLeIxaFv0a1Fd7CBr_QnEXP6GjSEq-R83hzaNmL_-iNbsohNz2u52g5_Dj6MEMuXDlKKikuBs9HvDnRI90naF2G_MF-lD8XtMyDN9MI7jteo8nRDggAMRAK4wgG0DoBhEHMEiCUE4YCwBUwiEECgDFHKCCIoIAYZIgEkBDGkHCUAkEIQcAaIZhAxAEhABBEkKWEAEIAxYwAhigkqCnCMAGZEM4ZQgABwgAnCSFAACCAUUAwTBBAwgqBkBJgGiEAAMAJgKgAAAPmIBMAGIUAQIg6wRAAQgglAKPCKIIUEUBIYwRBBAslgACHOMCAsAoAAwJBihAwFAIIQCuAIEQogYSjxihlEAEAmASIEccQQZCQSgBByBDCAGYgAIQCBIiiAAiCsHHCMYOYMcALYAgpwEBqGGBAAAUQhAAYZgxwQDDDlGIWACGAUsAQYgwDyghnGCIGAAAFAgoaBQQolgBQgKBECYcMJhYgAQUQhBCClACGEGWAAIApAgQSTgBAgGEAIESIIcQioYAAEABiCAAACMAUYYAQBYBDACgqkRIGUEUEQ0QBoQAUhgAhiEBEIUGIAQZCIbgAAgEBCzWSGEAUUJgYIygTBiAhxABUGAIMAAIRpAAwhgmBlAEAAcCAQEYwyAwACCDjSDBCIWQAYsQpBwwgDigFBSKEQEC4kAIhZ6RRihgpAFSaWMAMMgiMRBwDSggCAEIQEGEEMIg5JIQgjjlmAAFGQKQMoIQBAAzZwqCCCGMWCAaMUUQIo4QgyCgAAACAAWAMAAooaKwyBhKjGFAEEECMAYAJjIRRTAiChBFEAAGApAJZYIgSQgBjEBDCGIKEIBI4Aw1FAgBABIAOGEOAcAAZAKhgTihhQCEAAWOANFAxYgglQAACFCCGAYUeAAYhjYwjAAiCAEPOCwEUAIIIAohABhhBkGEAECgUFQgAJwBhWiGAAECKACaUEkQBgBEDgChjiGAgcAsUMcIBEABxAFBGDAEEiACsUoICAQwAggBEFREKKiUMYEAJAQQDThAiLCLOCEKBIIIoY5wQQAgDgFDIOOAQQQABg50QygBAFBDCAA",
                222,
                ["ad830438-1993-4267-af17-a2c3dd431c4d"],
            ),
            (
                "American Pie (Victor Calderone Filter Dub Mix)",
                "AQADtMoSJpKUJUkCNKOOsNlyMA8emMd59EENn7jw48qFB36O44cfBsePCz7RBz0sM7gOXDmMh8Zf4VNgacWPHxd8Bs-BEyaOK4cfPAHeHJZWHD9MHaeFPqgPn3hw4zp84jGKej1MCx--4zx84jlgKaOBC9fhE32Anocl4DtsXMSLw8yI47gOn-hzdIcv4Tpw5fDxRMpx-PhC48eL6_AJ7cFRj4co5cAVuLjCAI8hciHwHPmxdcR1vEgthkSP_od9oj_qo-lxHVp6_MX1IpeOqy5M9Ea4KZ_go_Kh42vRF82PioPFQ2vUBxeuHeXSomEa5EbeLKnQ_Dp6Eh_ODT3MQE8CuccD_3hwhRv8oUfXXGj6QvWJ73jWonlRHx31wP2gH-qOehdaZUJTHz9Rnd3gHuE0c_iHq0Mziah_vKEo9CGcI7yFh8vxHJrRKF2Oq0FXiJcmFF9QbUfz40uWEf0Jh-JR6sE5_ENTQ7sSPCuaf0L4HDuHS8eUo1aLT8eP9oJPtNKSCkdzVM_wbEfR_DilISdc6oY-5AuaEacQztSLm4eGZsd34CdOiT2aHz_8HFcIc8SjwC--7PDxHcYbwpqIK8vhw1Vwwc9xhfAXfFHwFl8uHJaP4yFcEVcGn4GfHT_84Arh4xzM1XhzWIOfC8cVws_wiIEZHX6OC34uPITb4BmOBzdchfgOV5FwXOFhDn7wwD-uED6ewWfgZ3hhTcEbfIVVPMSHHz98XCF8PIPPHFYzvIerHM9xMTCj4Ay-AIdxhfB5PINf-ME1-DkewoyIZ7iKK8rxFYdxhYY54hnMFX6OH66CKwx8os_Q97CmENbhE4dffGnxwhVELngziD-eBT6PZzAt3DRcmMuCH64y9CHaHX4NcyGuHn4mXNnhB8_wFTePD36IR4FVBs_xBs9xRbgyuMKzGD6ewZ8OP8ILa4qE5_jEwM9wFa4CH1cOV_iyBD6eBd9xhTjEh3gEnzm-DG_wKQdO_PgOXYY1hTj8HD_8HF8IV4Se4cWXHYer4C5ELsTxhfhxhbgiWC0e4hrhZ8LHHG92HG_gH28kPHiP8_AzXIF_tFGWoxGeCWcyHC0VoRbhivCz4Dn8BQ_h6hJ--BBPHG8gHlYjXIInBVcOn8EDc8QbGuZwRYHxLYaPZ_ALP7gMP7gCn8GX4T3MhfBhbcRxEsbD4IOeCw-s7tAVGj78HWfwDMZ3WLiywCoeZYE5wlWGK_CNK4S5Bc_gwzKeWzjh4zX8wQ8Dq_gU4Tn84SF83IPrHP6ABz6uLIcfXAxcBX7xOjA54cvh4yHMiIc_HH6IB-KXQM-Etzg-_PBx4r_wLLgIPwqOR_ADM2LwDH7xHCa-CT6-BT6e4T3eEBd84pThN3iDq_iCw89xHd8WuBesZtALPzjMRYGu7PDxEGaMZ_APPzyOKwz8HF9h7hAf4mrgCzcPH29W_NAV_HCV48OVBX5WCa6Kww8Oy4eeLRCFR1ngEz569IEZFX4mPMcZiD_MKIfP4gosE79wZXiP58IPP3iEF7qOh4SPEyd8fMvh41ngE64yHH6KK8RH-NnxHs_xXPBlHJZWXBTeLC_MEVazCy9cZccVBWdgTRn8Es9h-MEDa2KOdkEtwi_hh8EXHj6uEH6KDz9-_IZP4zBXvNGGr4cPV8GVwz-uEH6JLxNEHq6CQzxO-IuOLziDC-fxFdaDTwl84SH8w8d3-MGXw6_xaPiKN8fh4_gI08Ez-IXJC4ePw2-KB35xhUf6waeN44R5XCFhDqlMCzp84iOsI1-MXMSV4cdziDeJh4W_w8R3iD8-cfCPcw_0wFWG53h25Hhz-IeZHafwDLn2QA9-GA8Pczy-LPAHuYF74g1z-PBD4rAa4od4fPAhXsLl4Bk-Bj8-mCOeCRcDP4V4hscHHx98Fu4kaB96wi_xwJrgR8a1wFWDH67C4wsMPTt8iFWUHD2FPoPVwj8OP8IjBWYuvCl8wVxwCZ9y-PAZ4wuewe9hNcinC18GP1Ph44eZE6eNFOLD4IE19eh59Bne43CHH9cKd3jgFyZ7HO5I4fBrPMcLVxBPPGMGq8SVBdbhZ_gKPz0uj_AzPIrgM7jhZ4FPHcfhGl8I83gGP8dzPDhOwMDhHycu4zgsH8cDfwAjmJJOACGQMMgCoxgDhjEjABfEMKaAQIIxIxRz2DClhMKMAQeYMMw4oYAwTAmhGDJOACIMU8IkZpwADAlBDLMKIGCQEMYJgIUwSClGHGJYEICAQEAqY4RBghAkgHIkCSOQ4MR4AARxxgmCLGAIgWGAAdQAYwBSyEAKgHFACgWEFUQoJAhyDAEikABGEWIEUAAQhIkSlCFkjSEIGSUkAQAAZ4wDACDCCFCIAQMQMgIJgIBCwAhjkBINAUAYAwgZoYBhCBgGDAKGMcusQQwJwABDiAEghGHGKacAQgwIgQxTiBmHAGEAIKAYQ8IIhxhQjCEghBDCAcMEQAwQJhgSDCABEEDMCCEAY4oxIxBDDAjAmBIAWWQMYIYhBhgQhgljqHPEMUCZBcogZgBlzDCGEBPACOGQAEgwJhgACDDGmAPMAEaYFcIxQJACTCCEGAAIIGCYMOYwgwwzBAnCGFLIIICYMsAJBoBgCjAkhGAACYAAc8AyIixgAAmGnDFOEMAQYAwwwAyyCDEmBBIGCGQ8EIgJhAAjQDGmBBAMAWUIQEIIJIQhQgqGAANMCQOEEoAZBpgBThDEBDOMAcYIYsA5hBhigAFkAGCCCYOEQ0IAQRADzAAmADACIOOEcQoB4YQRABmAEDLCCweAYcgYJJBkgAmBgFGAGWGEwIgBg4QDDCBhBHwOKYUIMwgpRg0TAhlAmVAGQKqYoEIBZSwDyCHEBDAGCAAAY0wgLQQzTjmGACBGIEkEYEAwJAwCQAghDAIMCeMREYAxwAAxQDkFHGBKAMGEY0QwAKwDTDFhEAEGAAQYYAAA5xxnSDBlqLNCOemssVIA",
                366,
                ["d49583ed-b3b3-406c-9bad-13af9fd7cad8"],
            ),
            # Girls Aloud - Chemistry Megamix
            (
                "Chemistry Album Medley",
                "AQADtFOUL0pWXDheGj2FmHpxPJKOloaVJaiPm8Wh18h73D2YoBoR554IzeqRfg6uH8344UGPMHTxD9qPxs1wZ-qx_mjiTEa548jxo1mWoTSPF_mgJT_CGVditriPnvCFZN-RC08e4xv6xcQ5hNktqIs-IWeu4UwQHslSDs_x4xeFh8dTHD2aLydy8Uhu-XicoNdh4Yf1SPiCL4dH_McPW9HxHLF0-Dl0GTmeY2J-XFWOi8eRXjnkTDtiJdSx52geIbzEQi9yrcbz48mJijzC6Kqg8kPORN7w6DFC79ByIb6O_7gY4smLqxhrdBSaI5-OpDglNNmP8hu-HB3RfDneo8wS-MyD_IZHo2qyQ2Oq-DgVpD_-5Oia-VhDXMmNJ3i0CslyhFaW40kOfImRHvqRZxlxxUdTSeijqMJdJE90PMiThEHMQf0Q5tnR55hJE0-Wg0d_OE559ODzIPkRMlWOrVqOH6WN72jUDz3xhiMuZjwKHyfSRYIqSUe0R_iDJzr6E09x8QGv6EIYHZqcKEQufcMDfo7QZ0bzDEmQiycemRSacJHx5UG4ttCzI08-fCKJ_IX2CGFO4jse5lhz9MaN5xJ89NeI5DoiKuPR8_Cj47nR4KWG42qK6odf5At21RAjUTMR6S7RXdjOaEOtXPgKTsmDi6iqoKl2JE-EnMsk3E9Q-YYv9OAnIY8mnBeU82i-POijFJePR2KF_UIeViiaH2-yEGyOcyH6oS966UGmZ8cPOdh-nCNCLmiOUsqNe8pw6niz40qLvwgtBnojE9Guo9eL57gCdsH3Dc9T3IKdIaeO5GQePMtxNDf6RMHZId8OOQluos9SQ0s1nJGQS3mK58GN5EH641SMh8VPsOiz40JzDXmO5OgJs8d92M12VN_xJcUFPKQQPjkc-oHwI1c4vDs-XNuFdsJ_7EbsREiWo0q0Ec9VHP1iNM-QfMgvPHqMcicuJci1Q8vuIV6UDw-v4QnC1EGy48lxDs-Pd8eLo0fz8MiL5All_ImP5jJ6HWX3SPCPdjhDNMd7_PCY6LiSG-nRR4fyGeFzOCKaJZSc4hmeWaguCmHOHGoSJR9yUTl2HmEeHdqlI8e12niUnKiP-Cu06EdMaSsezsL3Ilm6yAjxC3eOK2uKy8d7rKPQ5EQtInkUI18vlInQ4BT45cAl5fiPsCp8zYF-ZEpRagT6DFOeYycrXMvx70WPK8fFYE_E4_yQqic66pi06TgD0T3qxdg_VBuDphvyrsJ-dC_hSCpRHdHzQdt4pJtXTCKe5WjODvWLJwyeH-EFLbfw4MyMCsr6InR0vEdvCn-Uo1Tz4gnuHOG3QfzRU0We40WfUYW5rEhzPCQHy8clXRDdBLqio0t6_DIq5xAvaMYT5oVOhLlQPsaP96hYHetFHSN-nBvwF49OpJ-M5J0cwb9ww-MJO8k249oj_PBO4wyOVE8OTUce6ime8EPZEv7x4ymuHG2-GfqJZh1RXcEv5kicJx1CiT_8C4-y42nhKibyqUhYEV8iHXV6HP0b-EHZ9ThKiTlhcscXHWkMbZuUi4iPM9vR8MZl40WtHufxh0FztGRRPcFH_MV9_DAf9N3x7kN4Q3xyhFc-vMd3oU8-nCRSSwlx6USnPsVFxugLXzp6BZd66NEn1HuQ_kbf4Bku5XgkhJZeNPkJfRa63IH6oV0vRB9qMeBD4znRpwgPLQ4zBnl8Ec_x7aD0FD-io88LLU724EROBn1yIZ304FeCR9KFwxuuLMfXCD4RPsaZ45uUo1RzrMfY6zhzmCreRcSPZ0hNJI_yoaSeoD08RifODF6jYvMXI8-Diy30YZOXoL-gkkmOJ-lR9oUPfUNfXHiSDz2eUfCVxAilHM9z3MSTHPUt9IyOKxvKB2aSKC7CLxZ0ZokQ_in8o5JUCi_aww_RhUc_WHmK1EmkQ_Xiw4ykIHxO9PB09GFefDueNWjuoGSy4l5whSfeS9jRLrDDCGV3_KgX5Ug_6E-oCLkeNEx_PB9qbmj-4HoQiboU-MxxNI9y_MiTUImDa5U4hN7hf0IPPcWzH1ei421xDZVzpI-FLjd-_MYeZTHuomyEMGegfwjJLIep8Pg9PPjhWzv6E7n-4zkaDv2IkUsOmT--OEXOjPiH5qgdXAmL7yqaoRceBaFuKI2OH6ZCXLPwBfrwXMVziD565Qiez2iuoc8nXG-MGzmzDM3RR5mgPMEzB9f6CM2SHeFP4uiLHG1y4SKeUEKlLkcj_YgP7HuMM8Z79EfzJZTw6UjGK4ep472GtDg3Hb-MqsfV477QHNNn5FMHfTvy4w6P_mgePM7xhD9KfoSPnsgTQeGHLrKFT4ePc4a4aYF_5DIupKtkQev4ETl17Dmao--Eh8eHqmEOH-GPSyP2kRKeHP05hKmy4-SPo6purIfzIj8uQT-26sOd4YdVHb8--CGO8_iOfHiOc8Z3nIenD_2xo6cDnzOuEyHUC-HKwPuNB8hHWfihH-8RsntxBeFhSgse6XDMGNqHUwv65cRWHVLUD92UE9soxKzRuDHu4_mE32hC5egYCZXz449xGz-hDy-PyszxJziPdtnRRMxC4tHh48yR_7gmhLlUdKNy5Pih5UW3KcgjH1ciY-7xoQ-or0Nl4XSRbEvhOFGKSJnwKDgeCdeWHuF3iPkR7nh0XB-aTOII7_geODe6XniPi8qIfoePfqHwLggtL9CcA4AoUYANpAAygiACGCIMAMeQEggAIIk4TAHEhASECGGEJIwIJIQgQkHiFBHEUKqFMAIIIggVlBgCEGGKECgAcYohQIhSgBIAiGNAIEEEUowIIIgihDABBCACFAMIcAQJIYQDSggCAEBCCAEUYogYyRAjghgBEBFCAGKIIE4BoAkCjgFFACWKAcC9AMAwJwgBCAAuDEHCCEMYUEAQYhgBEhCjGGAAEQAcIEwAAQw1DmACEACEKIQQAcgQEQQxAgFACCKCKUCFIEQIAIgFAAGCAEKCGGCAcAJRgIAQAhgBACEiCSAQJUIYAgFCDBEphEBAKSAgAgAgJpRCxAhGCCSAAGFIcVAILoRBCCkggDDKOIIJEARYqoEQgQAAABBAEQogUwQIIIASUDEBABDCGQAEUYQQJgQhRAEiBCACIIAEoIYAKgQAyhAjhAJEAGIQMgg4YgADxgDgiDGAEQMQYghgRIigQggAhFCIEGKEolZQIREhQhFiIBKICkcMAAAwZYhRCgBgjCHCSMUAEcIAYoCjgBIiABUGAAAIccYo6gQAQyADBiAKCAIEUYI5IqwQigDjEACIACCAAUQZIwgBxgBGhCAAIAOEokQSQ4wiEiDBjFJEOAGIcUAoQJgQCABgBEjMAUUIEAQQQBChxilANGKEOKCMEUQQgBkhhjOghRAAGSEQEgIIRohgwGBBiCAQAoAcU0AgQAxAihggkAGCMSGMMoA5QQABgACkICGAGMQIEoAZADRASABinAVAACIAAAwYQAAQDGlijGBCAaocd0YCQRADQAgjkOBEASCQMKIJQaAAAAFEmDJEIACAIgQRRhACAgBjADMKAOGkAQgIgxUTQAEjmJNCQAMUAQwEZQAAABhCCADMEIQkVQgAZxwwxlgmHHHGOQgMUQRJAohRAjggjAIIEKUEJZQAAwwSDBhoAEAAMaIIcMIRI5ShDEkAADCCCoAAQFwJaYgiQAgBLDVIEAcAApoQ4ASBAA",
                188,
                [],  # The  name do not exactly match, we rather avoid thid
            ),
        ]
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore

        for [song_name, acoustid, duration, expected] in scenarios:
            with self.subTest("Search Song", song_name=song_name):
                song = await provider.search_song_with_acoustid(
                    acoustid, duration, song_name
                )
                if expected == []:
                    self.assertIsNone(song)
                else:
                    self.assertIsNotNone(song)
                    self.assertIn(song.id, expected)  # pyright: ignore

    async def test_get_song_with_genres(self):
        provider: MusicBrainzProvider = (
            Context().get().get_provider(MusicBrainzProvider)
        )  # pyright: ignore
        song = await provider.get_song("08d07438-9b9c-4c41-a1d5-7211a32cc9ad")
        self.assertIsNotNone(song)
        self.assertEqual(song["title"], "Breathe on Me")  # pyright:ignore
        genres: List[str] = await provider.get_song_genres(song)  # pyright: ignore
        self.assertIsNotNone(genres)
        self.assertIn("Pop", genres)
        self.assertIn("Dance-Pop", genres)
        self.assertIn("Electro", genres)
        self.assertIn("Synth-Pop", genres)
        self.assertIn("Ballad", genres)
