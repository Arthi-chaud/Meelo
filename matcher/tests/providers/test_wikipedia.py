import asyncio
import pytest
import pytest_asyncio
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.wikipedia import WikipediaProvider


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestWikipedia:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_description(self, ctx):
        provider: WikipediaProvider = (
            Context().get().get_provider_or_raise(WikipediaProvider)
        )
        album = await provider.get_album("Do You Like My Tight Sweater?")
        assert album is not None
        description = await provider.get_album_description(album)
        assert description is not None
        assert "Sweater" in description
        assert "Moloko" in description

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_description(self, ctx):
        provider: WikipediaProvider = (
            Context().get().get_provider_or_raise(WikipediaProvider)
        )
        artist = await provider.get_album("Siobhán Donaghy")
        assert artist is not None
        description = await provider.get_artist_description(artist)
        assert description is not None
        assert "Sugababes" in description

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_description(self, ctx):
        provider: WikipediaProvider = (
            Context().get().get_provider_or_raise(WikipediaProvider)
        )
        song = await provider.get_song("Hung_Up")
        assert song is not None
        description = await provider.get_song_description(song)
        assert description is not None
        assert "lead single" in description
