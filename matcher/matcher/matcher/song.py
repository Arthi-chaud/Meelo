import asyncio
import logging

from typing import List
from matcher.models.api.dto import ExternalMetadataDto
from matcher.models.match_result import LyricsMatchResult, SongMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate
from . import common
from ..models.api.dto import ExternalMetadataSourceDto
from ..context import Context
from matcher.providers.features import (
    GetSongDescriptionFeature,
    GetPlainSongLyricsFeature,
    GetSongGenresFeature,
    GetSyncedSongLyricsFeature,
)


async def match_and_post_song(song_id: int, song_name: str, reuseSources: bool):
    try:
        context = Context.get()
        song = await context.client.get_song(song_id)

        async def match():
            if not reuseSources:
                return await match_song(
                    song_id,
                    song.name,
                    song.artist.name,
                    [f.name for f in song.featuring],
                    song.master.duration if song.master else None,
                    source_file.fingerprint if source_file else None,
                    None,
                )

            previous_metadata = await context.client.get_song_external_metadata(song_id)
            previous_sources = previous_metadata.sources if previous_metadata else []

            return await match_song(
                song_id,
                song.name,
                song.artist.name,
                [f.name for f in song.featuring],
                song.master.duration if song.master else None,
                source_file.fingerprint if source_file else None,
                previous_sources,
            )

        source_file = (
            await context.client.get_file(song.master.source_file_id)
            if song.master
            else None
        )
        res = await match()
        if res.metadata:
            logging.info(
                f"Matched with {len(res.metadata.sources)} providers for song {song_name}"
            )
            await context.client.post_external_metadata(res.metadata)

        if res.lyrics.plain or res.lyrics.synced:
            logging.info(
                f"Found {'synced lyrics' if res.lyrics.synced else 'lyrics'} for song {song.name}"
            )
            if res.lyrics.plain:  # Note should always be true
                await context.client.post_song_lyrics(
                    song_id, res.lyrics.plain, res.lyrics.synced
                )
        if res.genres:
            logging.info(f"Found {len(res.genres)} genres for song {song.name}")
            await context.client.post_song_genres(song_id, res.genres)
    except Exception as e:
        logging.error(e)


async def match_song(
    song_id: int,
    song_name: str,
    artist_name: str,
    featuring: List[str],
    duration: int | None,
    acoustid: str | None,
    sources_to_reuse: List[ExternalMetadataSourceDto] | None = None,
) -> SongMatchResult:
    need_genres = Context.get().settings.push_genres
    context = Context.get()
    external_sources: List[ExternalMetadataSourceDto] = []

    # We could skip using crossreference using wikidata,
    # because musicbrainz is not always useful for songs
    # + Searching using Genius seems efficient enough
    async def mb_search(mb: BaseProviderBoilerplate):
        return (
            (await mb.search_song_with_acoustid(acoustid, duration, song_name))
            if acoustid is not None and duration is not None
            else await mb.search_song(song_name, artist_name, featuring, duration)
        )

    async def resolve_sources():
        (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
            lambda mb: mb_search(mb),
            lambda mb, mbid: mb.get_song(mbid),
            lambda mb, mbid: mb.get_song_url_from_id(mbid),
        )

        # Link using Wikidata
        sources_ids = [source.provider_id for source in external_sources]
        if wikidata_id:
            external_sources = (
                external_sources
                + await common.get_sources_from_wikidata(
                    wikidata_id,
                    [
                        p
                        for p in context.get_providers()
                        if p.api_model.id not in sources_ids
                    ],
                    lambda p: p.get_wikidata_song_relation_key(),
                    lambda p, song_id: p.get_song_url_from_id(song_id),
                )
            )
        return external_sources

    external_sources = (
        sources_to_reuse if sources_to_reuse is not None else await resolve_sources()
    )

    res = SongMatchResult(
        ExternalMetadataDto(
            description=None,
            artist_id=None,
            rating=None,
            album_id=None,
            song_id=song_id,
            sources=[],
        ),
        LyricsMatchResult(None, None),
        [],
    )

    async def provider_task(
        source: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        if source is None and sources_to_reuse is not None:
            return
        (source, song) = await common.resolve_data_from_source(
            source,
            provider,
            lambda: provider.search_song(song_name, artist_name, featuring, duration),
            lambda id: provider.get_song(id),
            lambda url: provider.get_song_url_from_id(url),
            lambda id: provider.get_song_id_from_url(id),
        )
        if source:
            res.metadata.push_source(source)
        if not song:
            return
        await asyncio.gather(
            common.bind_feature_to_result(
                GetSongDescriptionFeature,
                provider,
                lambda: res.metadata.description is None,
                lambda get_description: get_description.run(song),
                lambda description: res.metadata.set_description_if_none(description),
            ),
            common.bind_feature_to_result(
                GetSongGenresFeature,
                provider,
                lambda: need_genres,
                lambda get_song_genres: get_song_genres.run(song),
                lambda genres: res.push_genres(genres),
            ),
            common.bind_feature_to_result(
                GetSyncedSongLyricsFeature,
                provider,
                lambda: res.lyrics.synced is None,
                lambda get_synced_lyrics: get_synced_lyrics.run(song),
                lambda lyrics: res.set_synced_lyrics(lyrics),
            ),
            common.bind_feature_to_result(
                GetPlainSongLyricsFeature,
                provider,
                lambda: res.lyrics.plain is None,
                lambda get_plain_lyrics: get_plain_lyrics.run(song),
                lambda lyrics: res.set_plain_lyrics_if_none(lyrics),
            ),
        )

    await common.run_tasks_from_sources(provider_task, external_sources)

    if not res.lyrics.plain and res.lyrics.synced:
        res.lyrics.plain = "\n".join([line for (_, line) in res.lyrics.synced])
    return res
