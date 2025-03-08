import logging

from typing import List
from matcher.models.api.dto import ExternalMetadataDto
from matcher.providers.features import (
    GetAlbumGenresFeature,
    GetSongDescriptionFeature,
    GetSongLyricsFeature,
)
from . import common
from ..models.api.dto import ExternalMetadataSourceDto
from ..context import Context


def match_and_post_song(song_id: int, song_name: str):
    try:
        context = Context.get()
        song = context.client.get_song(song_id)
        source_file = (
            context.client.get_file(song.master.source_file_id) if song.master else None
        )
        (dto, lyrics, genres) = match_song(
            song_id,
            song.name,
            song.artist.name,
            [f.name for f in song.featuring],
            song.master.duration if song.master else None,
            source_file.fingerprint if source_file else None,
        )
        if dto:
            logging.info(
                f"Matched with {len(dto.sources)} providers for song {song_name}"
            )
            context.client.post_external_metadata(dto)

        if lyrics:
            logging.info(f"Found lyrics for song {song.name}")
            context.client.post_song_lyrics(song_id, lyrics)
        if genres:
            logging.info(f"Found {len(genres)} genres for song {song.name}")
            context.client.post_song_genres(song_id, genres)
    except Exception as e:
        logging.error(e)


def match_song(
    song_id: int,
    song_name: str,
    artist_name: str,
    featuring: List[str],
    duration: int | None,
    acoustid: str | None,
) -> tuple[ExternalMetadataDto | None, str | None, List[str]]:
    need_genres = Context.get().settings.push_genres
    context = Context.get()
    genres: List[str] = []
    lyrics: str | None = None
    description: str | None = None
    external_sources: List[ExternalMetadataSourceDto] = []
    # We could skip using crossreference using wikidata,
    # because musicbrainz is not always useful for songs
    # + Searching using Genius seems efficient enough
    (wikidata_id, external_sources) = common.get_sources_from_musicbrainz(
        lambda mb: (
            mb.search_song_with_acoustid(acoustid, duration, song_name)
            or mb.search_song(song_name, artist_name, featuring, duration)
        )
        if acoustid is not None and duration is not None
        else mb.search_song(song_name, artist_name, featuring, duration),
        lambda mb, mbid: mb.get_song(mbid),
        lambda mb, mbid: mb.get_song_url_from_id(mbid),
    )

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.providers if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_song_relation_key(),
            lambda p, song_id: p.get_song_url_from_id(song_id),
        )

    # Resolve by searching
    sources_ids = [source.provider_id for source in external_sources]
    for provider in [p for p in context.providers if p.api_model.id not in sources_ids]:
        search_res = provider.search_song(song_name, artist_name, featuring, duration)
        if not search_res:
            continue
        song_url = provider.get_song_url_from_id(str(search_res.id))
        if not song_url:
            continue
        external_sources.append(
            ExternalMetadataSourceDto(song_url, provider.api_model.id)
        )

    for source in external_sources:
        provider = common.get_provider_from_external_source(source)
        is_useful = (
            (not description and provider.has_feature(GetSongDescriptionFeature))
            or (not lyrics and provider.has_feature(GetSongLyricsFeature))
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
        song = provider.get_song(provider_song_id)
        if not song:
            continue
        if not description:
            description = provider.get_song_description(song)
        if not lyrics:
            lyrics = provider.get_song_lyrics(song)
        genres = genres + (
            [g for g in provider.get_song_genres(song) or [] if g not in genres]
            if need_genres
            else []
        )
        if description and lyrics and genres:
            break
    return (
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
        lyrics,
        genres,
    )
