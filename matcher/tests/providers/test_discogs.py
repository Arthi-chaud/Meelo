import asyncio
import pytest
import pytest_asyncio
from matcher.context import Context
from tests.matcher.common import MatcherTestUtils
from matcher.providers.discogs import DiscogsProvider
from typing import List, Tuple


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestDiscogs:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_search_artist(self, ctx, subtests):
        scenarios: List[Tuple[str, str]] = [
            ("P!nk", "36988"),
            ("Christine & The Queens", "2714640"),
            ("Christine and The Queens", "2714640"),
            ("Florence + The Machine", "994835"),
            ("Florence and The Machine", "994835"),
            ("Selena Gomez & The Scene", "1867561"),
            ("Selena Gomez and the Scene", "1867561"),
        ]
        provider: DiscogsProvider = (
            Context().get().get_provider_or_raise(DiscogsProvider)
        )
        for [artist_name, expected] in scenarios:
            with subtests.test(
                "Search Artist",
                artist_name=artist_name,
                expected=expected,
            ):
                artist = await provider.search_artist(artist_name)
                assert artist is not None
                assert artist.id == expected

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_image(self, ctx):
        provider: DiscogsProvider = (
            Context().get().get_provider_or_raise(DiscogsProvider)
        )
        artist = await provider.get_artist("4480")
        assert artist is not None
        illustration = await provider.get_artist_illustration_url(artist)
        assert illustration is not None

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_genres(self, ctx):
        provider: DiscogsProvider = (
            Context().get().get_provider_or_raise(DiscogsProvider)
        )
        album = await provider.get_album("138437")
        assert album is not None
        genres = await provider.get_album_genres(album)
        assert genres == ["Electronic"]
