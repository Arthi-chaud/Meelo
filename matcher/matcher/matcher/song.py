import asyncio
import logging

from typing import List
from matcher.models.api.dto import ExternalMetadataDto
from matcher.models.match_result import LyricsMatchResult, SongMatchResult, SyncedLyrics
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.lrclib import LrcLibProvider
from . import common
from ..models.api.dto import ExternalMetadataSourceDto
from ..context import Context
from matcher.providers.features import (
    GetAlbumGenresFeature,
    GetSongDescriptionFeature,
    GetPlainSongLyricsFeature,
    GetSyncedSongLyricsFeature,
)


async def match_and_post_song(song_id: int, song_name: str):
    try:
        context = Context.get()
        song = context.client.get_song(song_id)
        source_file = (
            context.client.get_file(song.master.source_file_id) if song.master else None
        )
        res = await match_song(
            song_id,
            song.name,
            song.artist.name,
            [f.name for f in song.featuring],
            song.master.duration if song.master else None,
            source_file.fingerprint if source_file else None,
        )
        if res.metadata:
            logging.info(
                f"Matched with {len(res.metadata.sources)} providers for song {song_name}"
            )
            context.client.post_external_metadata(res.metadata)

        if res.lyrics:
            logging.info(
                f"Found {'synced lyrics' if res.lyrics.synced else 'lyrics'} for song {song.name}"
            )
            context.client.post_song_lyrics(
                song_id, res.lyrics.plain, res.lyrics.synced
            )
        if res.genres:
            logging.info(f"Found {len(res.genres)} genres for song {song.name}")
            context.client.post_song_genres(song_id, res.genres)
    except Exception as e:
        logging.error(e)


async def match_song(
    song_id: int,
    song_name: str,
    artist_name: str,
    featuring: List[str],
    duration: int | None,
    acoustid: str | None,
) -> SongMatchResult:
    need_genres = Context.get().settings.push_genres
    context = Context.get()
    lrclibProvider = Context.get().get_provider(LrcLibProvider)
    external_sources: List[ExternalMetadataSourceDto] = []
    genres: List[str] = []
    plain_lyrics: str | None = None
    synced_lyrics: SyncedLyrics | None = None
    description: str | None = None
    # We could skip using crossreference using wikidata,
    # because musicbrainz is not always useful for songs
    # + Searching using Genius seems efficient enough
    providers = (
        context.providers
        if not lrclibProvider
        else [
            p
            for p in context.providers
            if p.api_model.id != lrclibProvider.api_model.id
        ]
    )

    async def mb_search(mb: BaseProviderBoilerplate):
        return (
            (await mb.search_song_with_acoustid(acoustid, duration, song_name))
            if acoustid is not None and duration is not None
            else await mb.search_song(song_name, artist_name, featuring, duration)
        )

    (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
        lambda mb: mb_search(mb),
        lambda mb, mbid: mb.get_song(mbid),
        lambda mb, mbid: mb.get_song_url_from_id(mbid),
    )

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + await common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in providers if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_song_relation_key(),
            lambda p, song_id: p.get_song_url_from_id(song_id),
        )

    # Resolve by searching
    sources_ids = [source.provider_id for source in external_sources]

    async def search_song_url(p: BaseProviderBoilerplate):
        search_res = await p.search_song(song_name, artist_name, featuring, duration)
        if not search_res:
            return None
        song_url = p.get_song_url_from_id(str(search_res.id))
        if not song_url:
            return None
        return ExternalMetadataSourceDto(song_url, p.api_model.id)

    external_sources = external_sources + [
        res
        for res in await asyncio.gather(
            *[
                search_song_url(p)
                for p in providers
                if p.api_model.id not in sources_ids
            ]
        )
        if res is not None
    ]

    for source in external_sources:
        provider = common.get_provider_from_external_source(source)
        is_useful = (
            (not description and provider.has_feature(GetSongDescriptionFeature))
            or (
                not plain_lyrics
                and (
                    provider.has_feature(GetPlainSongLyricsFeature)
                    or (provider.has_feature(GetSyncedSongLyricsFeature))
                )
            )
            or (
                not synced_lyrics and (provider.has_feature(GetSyncedSongLyricsFeature))
            )
            or (
                need_genres
                and len(genres) == 0
                and provider.has_feature(GetAlbumGenresFeature)
            )
        )
        if not is_useful:
            continue
        provider_song_id = provider.get_song_id_from_url(source.url)
        if not provider_song_id:
            continue
        song = await provider.get_song(provider_song_id)
        if not song:
            continue
        if not description:
            description = await provider.get_song_description(song)
        if not synced_lyrics:
            synced_lyrics = await provider.get_synced_song_lyrics(song)
        if not plain_lyrics:
            plain_lyrics = await provider.get_plain_song_lyrics(song)
        if not plain_lyrics and synced_lyrics:
            plain_lyrics = "\n".join([line for (_, line) in synced_lyrics])
        genres = genres + (
            [g for g in await provider.get_song_genres(song) or [] if g not in genres]
            if need_genres
            else []
        )
        if description and plain_lyrics and synced_lyrics and genres:
            break

    if not plain_lyrics and synced_lyrics:
        plain_lyrics = "\n".join([line for (_, line) in synced_lyrics])

    if (not plain_lyrics or not synced_lyrics) and lrclibProvider is not None:
        song = await lrclibProvider._search_and_get_song(
            song_name, artist_name, featuring, duration
        )
        if song:
            synced = await lrclibProvider._parse_synced_lyrics(song)
            plain = (
                "\n".join([line for (_, line) in synced])
                if synced
                else (await lrclibProvider._parse_plain_lyrics(song))
            )

            if not plain_lyrics and plain:
                plain_lyrics = plain
            if synced:
                synced_lyrics = synced
                plain_lyrics = plain or plain_lyrics

    return SongMatchResult(
        ExternalMetadataDto(
            description,
            artist_id=None,
            rating=None,
            album_id=None,
            song_id=song_id,
            sources=external_sources,
        )
        if len(external_sources) > 0 or description
        else None,
        LyricsMatchResult(plain_lyrics, synced_lyrics) if plain_lyrics else None,
        genres,
    )
