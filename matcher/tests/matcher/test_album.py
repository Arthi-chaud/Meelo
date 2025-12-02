import asyncio
import pytest
import pytest_asyncio
import datetime
from matcher.matcher.album import match_album
from matcher.providers.domain import AlbumType
from tests.matcher.common import MatcherTestUtils
from matcher.context import Context

loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestMatchAlbum:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album(self, ctx):
        res = await match_album(
            1, "Confessions on a Dancefloor", "Madonna", AlbumType.STUDIO
        )
        # Type
        assert res.album_type is None
        # Genres
        assert len(res.genres) == 7
        assert "Pop" in res.genres
        assert "Dance-Pop" in res.genres
        assert "Synth-Pop" in res.genres
        assert "Disco" in res.genres
        assert "House" in res.genres
        assert "Electronic" in res.genres
        assert "Euro House" in res.genres
        # Rating
        assert res.metadata.rating is not None
        assert res.metadata.rating in [70, 80]
        # Release date
        assert res.release_date is not None
        assert res.release_date in [
            datetime.date(2005, 11, 11),
            datetime.date(2005, 11, 15),
        ]
        # Matches
        assert res.metadata is not None
        assert res.metadata.album_id == 1
        ##Description
        assert res.metadata.description is not None
        assert "Confessions" in res.metadata.description
        assert "2005" in res.metadata.description
        ##Sources
        assert len(res.metadata.sources) >= 5
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        assert wiki.url == "https://en.wikipedia.org/wiki/Confessions on a Dance Floor"
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        assert (
            meta.url
            == "https://www.metacritic.com/music/confessions-on-a-dance-floor/madonna"
        )
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/master/34205"
        ### Genius
        if not MatcherTestUtils.is_ci():
            [genius] = [p for p in res.metadata.sources if "genius" in p.url]
            assert (
                genius.url
                == "https://genius.com/albums/Madonna/Confessions-on-a-dance-floor"
            )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/release-group/122677be-e664-362d-95eb-be3ae126ec03"
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        assert allmusic.url == "https://www.allmusic.com/album/mw0000356345"

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album2(self, ctx):
        res = await match_album(
            1, "The Tortured Poets Department", "Taylor Swift", AlbumType.STUDIO
        )
        # Type
        assert res.album_type is None
        # Rating
        assert res.metadata.rating is not None
        assert res.metadata.rating == 60
        # Release date
        assert res.release_date is not None
        assert res.release_date == datetime.date(2024, 4, 19)
        # Matches
        assert res.metadata is not None
        assert res.metadata.album_id == 1
        # ##Description
        assert res.metadata.description is not None
        assert "eleventh studio album" in res.metadata.description
        ### Metacritic
        [meta] = [p for p in res.metadata.sources if "metacritic" in p.url]
        assert (
            meta.url
            == "https://www.metacritic.com/music/the-tortured-poets-department/taylor-swift"
        )
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        assert wiki.url == "https://en.wikipedia.org/wiki/The Tortured Poets Department"
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/master/3461018"
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        assert (
            genius.url
            == "https://genius.com/albums/Taylor-swift/The-tortured-poets-department"
        )
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/release-group/71c3eed6-466c-4aef-ad12-65a36d19467a"
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        assert allmusic.url == "https://www.allmusic.com/album/mw0004210541"

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_no_rating(self, ctx):
        res = await match_album(1, "Aéromusical", "Superbus", AlbumType.STUDIO)
        # Rating
        assert res.metadata.rating is None
        # Release date
        assert res.release_date is not None
        assert res.release_date.month == 3
        # Matches
        assert res.metadata is not None
        ##Description
        assert res.metadata.description is not None
        assert "Aéromusical" in res.metadata.description
        ### Wikipedia
        [wiki] = [p for p in res.metadata.sources if "wiki" in p.url]
        assert wiki.url == "https://en.wikipedia.org/wiki/Aéromusical"
        ### Discogs
        [discogs] = [p for p in res.metadata.sources if "discogs" in p.url]
        assert discogs.url == "https://www.discogs.com/master/426003"
        ### Genius
        [genius] = [p for p in res.metadata.sources if "genius" in p.url]
        assert genius.url == "https://genius.com/albums/Superbus/Aeromusical"
        ### Musicbrainz
        [mb] = [p for p in res.metadata.sources if "musicbrainz" in p.url]
        assert (
            mb.url
            == "https://musicbrainz.org/release-group/5666a1be-2156-3e94-847b-7bd5cc8b5b93"
        )
        ### Allmusic
        [allmusic] = [p for p in res.metadata.sources if "allmusic" in p.url]
        assert allmusic.url == "https://www.allmusic.com/album/mw0000770491"

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_ignore_genres(self, ctx):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = await match_album(
            1, "Confessions on a Dancefloor", "Madonna", AlbumType.STUDIO
        )
        # Teardown
        context.settings.push_genres = True
        # Genres
        assert len(res.genres) == 0

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_album_correct_type(self, ctx):
        # Setup
        context = Context.get()
        context.settings.push_genres = False
        res = await match_album(
            1, "(How to Live) as Ghosts", "10 Years", AlbumType.LIVE
        )
        # Teardown
        context.settings.push_genres = True
        assert res.album_type == AlbumType.STUDIO
