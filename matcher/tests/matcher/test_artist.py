import asyncio
from matcher.context import Context
from matcher.matcher.artist import match_artist
from tests.matcher.common import MatcherTestUtils
import pytest
import pytest_asyncio

loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestMatchArtist:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist(self, ctx):
        res = await match_artist(1, "Madonna")
        # Illustration
        assert res.illustration_url is not None
        assert "discogs" in res.illustration_url or "genius.com" in res.illustration_url

        # Matches
        assert res.metadata is not None
        assert res.metadata.artist_id == 1
        ##Description
        assert res.metadata.description is not None
        assert "Madonna" in str(res.metadata.description)
        ##Sources
        assert len(res.metadata.sources) == 6
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        assert wiki.url == "https://en.wikipedia.org/wiki/Madonna"
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        assert meta.url == "https://www.metacritic.com/person/madonna"
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/artist/3424607"
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        assert genius.url == "https://genius.com/artists/Madonna"
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/artist/79239441-bfd5-4981-a70c-55c3f15c1287"
        )

        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        assert allmusic.url == "https://www.allmusic.com/artist/mn0000237205"

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_with_special_char(self, ctx):
        await MatcherTestUtils.reset_sessions()
        res = await match_artist(1, "P!nk")

        # Illustration
        assert res.illustration_url is not None
        assert "discogs" in res.illustration_url
        # Matches
        assert res.metadata is not None
        assert res.metadata.artist_id == 1
        ##Description
        assert res.metadata.description is not None
        assert "American singer" in res.metadata.description
        ##Sources
        assert len(res.metadata.sources) == 6
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        assert wiki.url == "https://en.wikipedia.org/wiki/Pink (singer)"
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        assert meta.url == "https://www.metacritic.com/person/p!nk"
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/artist/1525636"
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        assert genius.url == "https://genius.com/artists/P-nk"
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/artist/f4d5cc07-3bc9-4836-9b15-88a08359bc63"
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        allmusic.url == "https://www.allmusic.com/artist/mn0001878899"

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_artist_with_placeholder_image(self, ctx):
        res = await match_artist(1, "Peplab")
        # Illustration
        assert res.illustration_url is not None
        # We want to get Discogs' image, not genius' as it's a placeholder
        assert "genius" not in res.illustration_url
        assert "discogs" in res.illustration_url
        # Matches
        assert res.metadata is not None
        assert res.metadata.artist_id == 1
        # ##Sources
        assert len(res.metadata.sources) >= 2
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/artist/9663"
        ### Genius
        ### CI fails here (thanks cloudflare) because we do a search for this provider
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            assert genius.url == "https://genius.com/artists/Peplab"
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/artist/ccccf1ba-c503-48d7-8c8c-f7c80c3347d4"
        )
