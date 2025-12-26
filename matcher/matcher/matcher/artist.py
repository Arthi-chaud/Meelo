import asyncio
import logging
from typing import List

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from matcher.models.match_result import ArtistMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import (
    GetArtistDescriptionFeature,
    GetArtistIllustrationUrlFeature,
)
from ..context import Context
from . import common


async def match_and_post_artist(artist_id: int, artist_name: str, reuseSources: bool):
    async def match():
        if not reuseSources:
            return await match_artist(artist_id, artist_name, None)
        previous_metadata = await context.client.get_artist_external_metadata(artist_id)
        previous_sources = previous_metadata.sources if previous_metadata else []
        return await match_artist(
            artist_id,
            artist_name,
            previous_sources,
        )

    try:
        context = Context.get()
        res = await match()
        if len(res.metadata.sources):
            logging.info(
                f"Matched with {len(res.metadata.sources)} providers for artist {artist_name}{' using known sources' if reuseSources else ''}"
            )
            await context.client.post_external_metadata(res.metadata)
        if res.illustration_url:
            logging.info(f"Found image for artist {artist_name}")
            await context.client.post_artist_illustration(
                artist_id, res.illustration_url
            )
    except Exception as e:
        logging.error(e)


async def match_artist(
    artist_id: int,
    artist_name: str,
    sources_to_reuse: List[ExternalMetadataSourceDto] | None,
) -> ArtistMatchResult:
    context = Context.get()

    async def resolve_sources():
        (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
            lambda mb: mb.search_artist(artist_name),
            lambda mb, mbid: mb.get_artist(mbid),
            lambda mb, mbid: mb.get_artist_url_from_id(mbid),
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
                    lambda p: p.get_wikidata_artist_relation_key(),
                    lambda p, artist_id: p.get_artist_url_from_id(artist_id),
                )
            )
        return external_sources

    external_sources = (
        sources_to_reuse if sources_to_reuse is not None else (await resolve_sources())
    )

    res = ArtistMatchResult(
        ExternalMetadataDto(
            None,
            artist_id=artist_id,
            rating=None,
            album_id=None,
            song_id=None,
            sources=[],
        ),
        None,
    )

    async def provider_task(
        source: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        if source is None and sources_to_reuse is not None:
            return
        (source, artist) = await common.resolve_data_from_source(
            source,
            provider,
            lambda: provider.search_artist(artist_name),
            lambda id: provider.get_artist(id),
            lambda url: provider.get_artist_url_from_id(url),
            lambda id: provider.get_artist_id_from_url(id),
        )
        if source:
            res.metadata.push_source(source)
        if not artist:
            return

        await asyncio.gather(
            common.bind_feature_to_result(
                GetArtistDescriptionFeature,
                provider,
                lambda: res.metadata.description is None,
                lambda get_description: get_description.run(artist),
                lambda description: res.metadata.set_description_if_none(description),
            ),
            common.bind_feature_to_result(
                GetArtistIllustrationUrlFeature,
                provider,
                lambda: res.illustration_url is None,
                lambda get_illustration_url: get_illustration_url.run(artist),
                lambda url: res.set_illustration_url_if_none(url),
            ),
        )

    await common.run_tasks_from_sources(provider_task, external_sources)

    return res
