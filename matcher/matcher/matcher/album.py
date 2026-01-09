import asyncio
import logging

from datetime import datetime
from typing import List
from matcher.models.api.dto import ExternalMetadataDto
from matcher.models.match_result import AlbumMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.domain import AlbumType
from matcher.providers.features import (
    GetAlbumDescriptionFeature,
    GetAlbumGenresFeature,
    GetAlbumRatingFeature,
    GetAlbumReleaseDateFeature,
    GetAlbumTypeFeature,
)
from . import common
from ..models.api.dto import ExternalMetadataSourceDto
from ..context import Context

OVERRIDABLE_ALBUM_TYPES = [AlbumType.STUDIO, AlbumType.LIVE]


async def match_and_post_album(album_id: int, album_name: str, reuseSources: bool):
    try:

        async def match():
            if not reuseSources:
                return await match_album(
                    album_id,
                    album_name,
                    album.artist.name if album.artist else None,
                    album.type,
                    None,
                )
            previous_metadata = await context.client.get_album_external_metadata(
                album_id
            )
            previous_sources = previous_metadata.sources if previous_metadata else []
            return await match_album(
                album_id,
                album_name,
                album.artist.name if album.artist else None,
                album.type,
                previous_sources,
            )

        context = Context.get()
        album = await context.client.get_album(album_id)
        res = await match()
        # We only care about the new album type if the previous type is Studio or live (see #1089)
        album_type = (
            res.album_type
            if album.type in OVERRIDABLE_ALBUM_TYPES and res.album_type
            else album.type
        )
        old_release_date = (
            datetime.fromisoformat(album.release_date).date()
            if album.release_date
            else None
        )
        if res.metadata:
            logging.info(
                f"Matched with {len(res.metadata.sources)} providers for album {album_name}"
            )
            await context.client.post_external_metadata(res.metadata)
        if old_release_date and res.release_date:
            if old_release_date.month != 1 and old_release_date.day != 1:
                logging.info(
                    "Ignoring matched release date as API already provides it."
                )
                res.release_date = None
            elif abs(res.release_date.year - old_release_date.year) > 2:
                logging.info(
                    f"Release date found ({res.release_date.year}) is too far from the one from the API ({old_release_date.year})."
                )
                logging.info("Probably a mismatch. Ignoring...")
                res.release_date = None
        if res.release_date:
            logging.info(f"Updating release date for album {album_name}")
        if res.genres:
            logging.info(f"Found {len(res.genres)} genres for album {album_name}")
        if album_type != album.type and album_type != AlbumType.OTHER:
            logging.info(f"Found type for album {album_name}: {album_type.value}")
        if (
            res.release_date
            or res.genres
            or (album_type != album.type)
            and album_type != AlbumType.OTHER
        ):
            await context.client.post_album_update(
                album_id, res.release_date, res.genres, album_type
            )
    except Exception as e:
        logging.error(e)


async def match_album(
    album_id: int,
    album_name: str,
    artist_name: str | None,
    type: AlbumType,
    sources_to_reuse: List[ExternalMetadataSourceDto] | None = None,
) -> AlbumMatchResult:
    need_genres = Context.get().settings.push_genres
    context = Context.get()
    should_look_for_album_type = (
        type == AlbumType.OTHER or type in OVERRIDABLE_ALBUM_TYPES
    )

    async def resolve_sources():
        (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
            lambda mb: mb.search_album(album_name, artist_name),
            lambda mb, mbid: mb.get_album(mbid),
            lambda mb, mbid: mb.get_album_url_from_id(mbid),
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
                    lambda p: p.get_wikidata_album_relation_key(),
                    lambda p, album_id: p.get_album_url_from_id(album_id),
                )
            )
        return external_sources

    external_sources = (
        sources_to_reuse if sources_to_reuse is not None else (await resolve_sources())
    )

    res = AlbumMatchResult(
        ExternalMetadataDto(
            description=None,
            artist_id=None,
            rating=None,
            album_id=album_id,
            song_id=None,
            sources=[],
        ),
        None,
        None,
        [],
    )

    async def provider_task(
        source: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        if source is None and sources_to_reuse is not None:
            return
        (source, album) = await common.resolve_data_from_source(
            source,
            provider,
            lambda: provider.search_album(album_name, artist_name),
            lambda id: provider.get_album(id),
            lambda url: provider.get_album_url_from_id(url),
            lambda id: provider.get_album_id_from_url(id),
        )
        if source:
            res.metadata.push_source(source)
        if not album:
            return
        await asyncio.gather(
            common.bind_feature_to_result(
                GetAlbumDescriptionFeature,
                provider,
                lambda: res.metadata.description is None,
                lambda get_description: get_description.run(album),
                lambda description: res.metadata.set_description_if_none(description),
            ),
            common.bind_feature_to_result(
                GetAlbumReleaseDateFeature,
                provider,
                lambda: res.release_date is None,
                lambda get_release_date: get_release_date.run(album),
                lambda release_data: res.set_release_date_if_none(release_data),
            ),
            common.bind_feature_to_result(
                GetAlbumRatingFeature,
                provider,
                lambda: res.metadata.rating is None,
                lambda get_rating: get_rating.run(album),
                lambda rating: res.metadata.set_rating_if_none(rating),
            ),
            common.bind_feature_to_result(
                GetAlbumTypeFeature,
                provider,
                lambda: res.album_type is None and should_look_for_album_type,
                lambda get_album_type: get_album_type.run(album),
                lambda album_type: res.set_album_type_if_none(album_type),
            ),
            common.bind_feature_to_result(
                GetAlbumGenresFeature,
                provider,
                lambda: need_genres,
                lambda get_album_genres: get_album_genres.run(album),
                lambda genres: res.push_genres(genres),
            ),
        )

    await common.run_tasks_from_sources(provider_task, external_sources)
    if res.album_type == type:
        res.album_type = None
    return res
