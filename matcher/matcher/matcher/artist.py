import logging

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from ..context import Context
from . import common


def match_and_post_artist(artist_id: int, artist_name: str):
    try:
        (dto, illustration_url) = match_artist(artist_id, artist_name)
        context = Context.get()
        if dto:
            logging.info(
                f"Matched with {len(dto.sources)} providers for artist {artist_name}"
            )
            context.client.post_external_metadata(dto)
        if illustration_url:
            logging.info(f"Found image for artist {artist_name}")
            context.client.post_artist_illustration(artist_id, illustration_url)
    except Exception as e:
        logging.error(e)


def match_artist(
    artist_id: int, artist_name: str
) -> tuple[ExternalMetadataDto | None, str | None]:
    context = Context.get()
    artist_illustration_url: str | None = None
    (wikidata_id, external_sources) = common.get_sources_from_musicbrainz(
        lambda mb: mb.search_artist(artist_name),
        lambda mb, mbid: mb.get_artist(mbid),
        lambda mb, mbid: mb.get_artist_url_from_id(mbid),
    )
    description: str | None = None

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.providers if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_artist_relation_key(),
            lambda p, artist_id: p.get_artist_url_from_id(artist_id),
        )

    # Resolve by searching
    sources_ids = [source.provider_id for source in external_sources]
    for provider in [p for p in context.providers if p.api_model.id not in sources_ids]:
        search_res = provider.search_artist(artist_name)
        if not search_res:
            continue
        artist_url = provider.get_artist_url_from_id(str(search_res.id))
        if not artist_url:
            continue
        external_sources.append(
            ExternalMetadataSourceDto(artist_url, provider.api_model.id)
        )

    for source in external_sources:
        if description and artist_illustration_url:
            break
        provider = common.get_provider_from_external_source(source)
        provider_artist_id = provider.get_artist_id_from_url(source.url)
        if not provider_artist_id:
            continue
        artist = provider.get_artist(provider_artist_id)
        if not artist:
            continue
        if not description:
            description = provider.get_artist_description(artist)
        if not artist_illustration_url:
            artist_illustration_url = provider.get_artist_illustration_url(artist)
    return (
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
