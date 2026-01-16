import asyncio
import pytest
import pytest_asyncio
import datetime
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.allmusic import AllMusicProvider


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestAllMusic:
    def test_is_album_url(self, ctx):
        provider: AllMusicProvider = (
            Context().get().get_provider_or_raise(AllMusicProvider)
        )
        assert provider.is_album_url("https://www.allmusic.com/album/mw0000356345")

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_rating_and_release_date(self, ctx):
        provider: AllMusicProvider = (
            Context().get().get_provider_or_raise(AllMusicProvider)
        )
        album = await provider.get_album("mw0004378326")
        assert album is not None
        rating = await provider.get_album_rating(album)
        assert rating == 70
        release_date = await provider.get_album_release_date(album)
        assert release_date == datetime.date(2024, 10, 18)

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_rating_when_null_and_release_date(self, ctx):
        provider: AllMusicProvider = (
            Context().get().get_provider_or_raise(AllMusicProvider)
        )
        album = await provider.get_album("mw0000770491")
        assert album is not None
        rating = await provider.get_album_rating(album)
        assert rating is None
        release_date = await provider.get_album_release_date(album)
        assert release_date == datetime.date(2003, 3, 24)
