import asyncio
import pytest
import pytest_asyncio
from matcher.context import Context
from matcher.matcher.song import match_song
from tests.matcher.common import MatcherTestUtils


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestMatchSong:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_with_featuring_artist(self, ctx):
        res = await match_song(
            1, "It Should Be Easy", "Britney Spears", ["will.i.am"], None, None
        )
        # Genres
        assert "Pop" in res.genres
        assert "Dance-Pop" in res.genres
        assert "Electronic" in res.genres
        # Lyrics

        if not MatcherTestUtils.is_ci():
            assert res.lyrics is not None
            assert res.lyrics.plain is not None
            assert res.lyrics.synced is not None

            assert "I've been thinking" in res.lyrics.plain
            assert "baby, you're my right now\n" in res.lyrics.plain
            assert res.lyrics.synced[0][0] == 15.22
            assert res.lyrics.synced[0][1] == "I've been thinking"

        # Matches
        assert res.metadata is not None
        assert res.metadata.song_id == 1
        ##Description
        if not MatcherTestUtils.is_ci():
            assert res.metadata.description is not None
            assert "will.i.am" in res.metadata.description
        ##Sources
        assert len(res.metadata.sources) >= 1
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            assert (
                genius.url
                == "https://genius.com/Britney-spears-it-should-be-easy-lyrics"
            )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/recording/b4e91acc-17d6-4e1a-b08e-e06714bab7bd"
        )

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song_ignore_genres(self, ctx):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = await match_song(
            1, "It Should Be Easy", "Britney Spears", ["will.i.am"], None, None
        )
        # Teardown
        context.settings.push_genres = True
        # Genres
        assert len(res.genres) == 0
