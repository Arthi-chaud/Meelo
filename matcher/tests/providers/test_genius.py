import asyncio
import pytest
import pytest_asyncio
import datetime
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.genius import GeniusProvider
from typing import List, Tuple


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestGenius:
    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_search_artist(self, ctx, subtests):
        scenarios: List[Tuple[str, str]] = [
            ("P!nk", "P!nk"),
            ("Christine & The Queens", "Christine and the Queens"),
            ("Christine and The Queens", "Christine and the Queens"),
            ("Florence + The Machine", "Florence + the Machine"),
            ("Florence and The Machine", "Florence + the Machine"),
            ("Selena Gomez & The Scene", "Selena Gomez & The Scene"),
            ("Selena Gomez and the Scene", "Selena Gomez & The Scene"),
        ]
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        for [artist_name, expected] in scenarios:
            with subtests.test(
                "Search Artist",
                artist_name=artist_name,
                expected=expected,
            ):
                artist = await provider.search_artist(artist_name)
                assert artist is not None
                assert artist.id == expected

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_description_and_image(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        artist = await provider.get_artist("Massive Attack")
        assert artist is not None
        description = await provider.get_artist_description(
            artist,
        )
        assert description is not None
        assert "Bristol" in description
        assert "and formerly Andy" in description
        illustration = await provider.get_artist_illustration_url(
            artist,
        )
        assert illustration is not None

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_without_image(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        artist = await provider.get_artist("Peplab")
        assert artist is not None
        illustration = await provider.get_artist_illustration_url(
            artist,
        )
        assert illustration is None

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_release_date(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        album = await provider.get_album("Superbus/Aeromusical")
        assert album is not None
        release_date = await provider.get_album_release_date(
            album,
        )
        assert release_date == datetime.date(2002, 3, 26)

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_lyrics(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        song = await provider.get_song("Girls-aloud-models")
        assert song is not None
        # Lyrics
        lyrics = await provider.get_plain_song_lyrics(song)
        assert lyrics is not None
        lines = lyrics.split("\n")
        assert "[Intro: Sarah & Cheryl]" == lines[0]
        assert "Girls girls girls girls girls girls girls" == lines[len(lines) - 1]

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_lyrics_and_description(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        song = await provider.get_song("Rachel-stevens-some-girls")
        assert song is not None
        # Lyrics
        lyrics = await provider.get_plain_song_lyrics(song)
        assert lyrics is not None
        lines = lyrics.split("\n")
        assert "[Verse 1]" == lines[0]
        assert "(A chat, a gift)" in lines
        assert "All I seem to get is the other, other" in lines
        # Description
        desc = await provider.get_song_description(song)
        assert desc is not None
        assert desc.startswith("Some Girls is a single released by Rachel Stevens")
        assert "album Come and Get It and" in desc

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_wo_lyrics_and_description(self, ctx):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        song = await provider.get_song("Madonna-die-another-day-dirty-vegas-dub")
        assert song is not None
        # Lyrics
        lyrics = await provider.get_plain_song_lyrics(song)
        assert lyrics is None
        # Description
        desc = await provider.get_song_description(song)
        assert desc is None

    @pytest.mark.skipif(MatcherTestUtils.is_ci(), reason="")
    @pytest.mark.asyncio(loop_scope="module")
    async def test_search_song(self, ctx, subtests):
        provider: GeniusProvider = Context().get().get_provider_or_raise(GeniusProvider)
        await provider.reset_session()
        scenarios: List[Tuple[str, str, List[str], str | None]] = [
            ("Overrated", "Siobhan Donaghy", [], "Siobhan-donaghy-overrated"),
            ("Work B**ch", "Britney Spears", [], "Britney-spears-work-bch-work-work"),
            ("Work Bitch", "Britney Spears", [], "Britney-spears-work-bitch"),
            ("Gimme More", "Britney Spears", [], "Britney-spears-gimme-more"),
            ("Anti-Hero", "Taylor Swift", [], "Taylor-swift-anti-hero"),
            ("E.T.", "Katy Perry", [], "Katy-perry-et"),
            ("E.T.", "Katy Perry", ["Kanye West"], "Katy-perry-et-remix"),
            ("Fun For Me", "Moloko", [], "Moloko-fun-for-me"),
            ("M!ssundaztood", "P!nk", [], "P-nk-m-ssundaztood"),
            (
                "Bad Romance (Chew Fu H1N1 Fix)",
                "Lady Gaga",
                [],
                "Lady-gaga-bad-romance-chew-fu-h1n1-fix",
            ),
            # ("Drive", "Peplab", [], None),
        ]
        for [song_name, artist_name, feat, expected] in scenarios:
            with subtests.test(
                "Search Song",
                song_name=song_name,
                artist_name=artist_name,
                feat=feat,
                expected=expected,
            ):
                search_res = await provider.search_song(
                    song_name, artist_name, feat, None
                )
                if expected:
                    assert search_res is not None
                    assert search_res.id == expected
                else:
                    assert search_res is None
