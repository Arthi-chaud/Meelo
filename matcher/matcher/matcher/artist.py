import asyncio
import logging

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from matcher.models.match_result import ArtistMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import (
    GetArtistDescriptionFeature,
    GetArtistIllustrationUrlFeature,
)
from matcher.providers.thread import SharedValue
from ..context import Context
from . import common


async def match_and_post_artist(artist_id: int, artist_name: str):
    try:
        res = await match_artist(artist_id, artist_name)
        context = Context.get()
        if len(res.metadata.sources):
            logging.info(
                f"Matched with {len(res.metadata.sources)} providers for artist {artist_name}"
            )
            context.client.post_external_metadata(res.metadata)
        if res.illustration_url:
            logging.info(f"Found image for artist {artist_name}")
            context.client.post_artist_illustration(artist_id, res.illustration_url)
    except Exception as e:
        logging.error(e)


async def match_artist(artist_id: int, artist_name: str) -> ArtistMatchResult:
    context = Context.get()
    (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
        lambda mb: mb.search_artist(artist_name),
        lambda mb, mbid: mb.get_artist(mbid),
        lambda mb, mbid: mb.get_artist_url_from_id(mbid),
    )

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + await common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.get_providers() if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_artist_relation_key(),
            lambda p, artist_id: p.get_artist_url_from_id(artist_id),
        )

    shared_res = SharedValue(
        ArtistMatchResult(
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
    )

    async def provider_task(
        source: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        (source, artist) = await common.resolve_data_from_source(
            source,
            provider,
            lambda: provider.search_artist(artist_name),
            lambda id: provider.get_artist(id),
            lambda url: provider.get_artist_url_from_id(url),
            lambda id: provider.get_artist_id_from_url(id),
        )
        if source:
            await shared_res.update(lambda r: r.metadata.push_source(source))
        if not artist:
            return

        await asyncio.gather(
            common.bind_feature_to_result(
                GetArtistDescriptionFeature,
                provider,
                lambda: shared_res.to_bool(lambda r: r.metadata.description is None),
                lambda get_description: get_description.run(artist),
                lambda description: shared_res.update(
                    lambda r: r.metadata.set_description_if_none(description)
                ),
            ),
            common.bind_feature_to_result(
                GetArtistIllustrationUrlFeature,
                provider,
                lambda: shared_res.to_bool(lambda r: r.illustration_url is None),
                lambda get_illustration_url: get_illustration_url.run(artist),
                lambda url: shared_res.update(
                    lambda r: r.set_illustration_url_if_none(url)
                ),
            ),
        )

    await common.run_tasks_from_sources(provider_task, external_sources)

    return shared_res.unsafe_get_value()
