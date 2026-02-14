import asyncio
import pytest
import pytest_asyncio
from matcher.context import Context
from typing import List, Tuple
from matcher.providers.lrclib import LrcLibProvider
from tests.matcher.common import MatcherTestUtils


loop: asyncio.AbstractEventLoop


@pytest_asyncio.fixture(scope="module")
async def ctx():
    MatcherTestUtils.setup_context()
    yield Context.get()
    await MatcherTestUtils.reset_sessions()


class TestLrcLib:
    @pytest.mark.asyncio(loop_scope="module")
    async def test_search_song(self, ctx, subtests):
        scenarios: List[Tuple[str, str, List[str], int, List[int]]] = [
            ("E.T.", "Katy Perry", ["Kanye West"], 230, [960041, 3695008, 1031603]),
            (
                "It Should Be Easy",
                "Britney Spears",
                ["will.i.am"],
                209,
                [15055522],
            ),
            ("Get The Party Started", "P!nk", [], 192, [694905, 1334986, 1902620]),
            ("Intro", "Girls Aloud", [], 42, [141026, 141025]),
            ("Silver Strand", "The Corrs", [], 100, []),
            (
                "So Young (K-Klass Remix)",
                "The Corrs",
                [],
                254,
                [16406807, 385738, 10327002],
            ),
            (
                "Who's That Chick? (Single Version)",
                "David Guetta",
                ["Rihanna"],
                167,
                [3145103],
            ),
            (
                "Morenito",
                "Stephane Pompougnac",
                ["Clementine"],
                334,
                [7379532],
            ),
        ]
        provider: LrcLibProvider = Context().get().get_provider_or_raise(LrcLibProvider)
        for [song_name, artist_name, feats, duration, expected] in scenarios:
            with subtests.test(
                "Search Song", song=song_name, artist=artist_name, feats=feats
            ):
                song = await provider._search_song(
                    song_name, artist_name, feats, duration
                )
                if len(expected) == 0:
                    assert song is None
                else:
                    assert song is not None
                    assert song.id in expected

    @pytest.mark.asyncio(loop_scope="module")
    async def test_get_song(self, ctx):
        provider: LrcLibProvider = Context().get().get_provider_or_raise(LrcLibProvider)
        song = await provider._search_song("Hung Up", "Madonna", [], None)
        assert song is not None
        song = song.data
        assert song is not None
        assert song["id"] == 45828
        assert song["plainLyrics"] is not None
        assert song["syncedLyrics"] is not None

        plain_lyrics = await provider.get_plain_song_lyrics(song)
        assert plain_lyrics is not None
        plain_lyrics = str(plain_lyrics)
        assert plain_lyrics.startswith("Time goes by so slowly\nTime goes by so slowly")
        assert plain_lyrics.endswith("I'm tired of waiting on you\n")

        synced_lyrics = await provider.get_synced_song_lyrics(song)

        assert synced_lyrics is not None

        def get_lyrics_at(ts: float):
            return [line for (t, line) in synced_lyrics if t == ts][0]

        assert get_lyrics_at(6.71) == "Time goes by so slowly"
        assert get_lyrics_at(229.33) == ""
        assert get_lyrics_at(330.84) == "Waiting for your call"
