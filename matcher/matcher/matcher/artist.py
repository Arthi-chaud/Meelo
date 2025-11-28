import asyncio
import logging

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from matcher.models.match_result import ArtistMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.features import (
    GetArtistDescriptionFeature,
    GetArtistIllustrationUrlFeature,
)
from ..context import Context
from . import common


async def match_and_post_artist(artist_id: int, artist_name: str):
    try:
        res = await match_artist(artist_id, artist_name)
        context = Context.get()
        if res.metadata:
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
    artist_illustration_url: str | None = None
    (wikidata_id, external_sources) = await common.get_sources_from_musicbrainz(
        lambda mb: mb.search_artist(artist_name),
        lambda mb, mbid: mb.get_artist(mbid),
        lambda mb, mbid: mb.get_artist_url_from_id(mbid),
    )
    description: str | None = None

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + await common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.providers if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_artist_relation_key(),
            lambda p, artist_id: p.get_artist_url_from_id(artist_id),
        )

    # Resolve by searching
    sources_ids = [source.provider_id for source in external_sources]

    async def search_artist_url(p: BaseProviderBoilerplate):
        search_res = await p.search_artist(artist_name)
        if not search_res:
            return None
        artist_url = p.get_artist_url_from_id(str(search_res.id))
        if not artist_url:
            return None
        return ExternalMetadataSourceDto(artist_url, p.api_model.id)

    external_sources = external_sources + [
        res
        for res in await asyncio.gather(
            *[
                search_artist_url(p)
                for p in context.providers
                if p.api_model.id not in sources_ids
            ]
        )
        if res is not None
    ]

    for source in external_sources:
        provider = common.get_provider_from_external_source(source)
        is_useful = (
            not description and provider.has_feature(GetArtistDescriptionFeature)
        ) or (
            not artist_illustration_url
            and provider.has_feature(GetArtistIllustrationUrlFeature)
        )
        if not is_useful:
            continue
        provider_artist_id = provider.get_artist_id_from_url(source.url)
        if not provider_artist_id:
            continue
        artist = await provider.get_artist(provider_artist_id)
        if not artist:
            continue
        if not description:
            description = await provider.get_artist_description(artist)
        if not artist_illustration_url:
            artist_illustration_url = await provider.get_artist_illustration_url(artist)
        if description and artist_illustration_url:
            break
    return ArtistMatchResult(
        ExternalMetadataDto(
            description,
            artist_id=artist_id,
            rating=None,
            album_id=None,
            song_id=None,
            sources=external_sources,
        )
        if len(external_sources) > 0 or description
        else None,
        artist_illustration_url,
    )
