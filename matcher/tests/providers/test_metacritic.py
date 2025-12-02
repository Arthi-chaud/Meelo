import asyncio
import pytest
import pytest_asyncio
import datetime
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.metacritic import MetacriticProvider


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestMetacritic:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_rating_and_release_date(self, ctx):
        provider: MetacriticProvider = (
            Context().get().get_provider_or_raise(MetacriticProvider)
        )
        album = await provider.get_album("renaissance/beyonce")
        assert album is not None
        rating = await provider.get_album_rating(album)
        assert rating == 91
        release_date = await provider.get_album_release_date(album)
        assert release_date == datetime.date(2022, 7, 29)
