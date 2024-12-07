import logging

from datetime import date
from matcher.models.api.dto import ExternalMetadataDto
from . import common
from ..models.api.dto import ExternalMetadataSourceDto
from ..context import Context


def match_and_post_album(album_id: int, album_name: str):
    try:
        album = Context.get().client.get_album(album_id)
        (dto, release_date) = match_album(album_id, album_name, album.artist_name)
        context = Context.get()
        if dto:
            logging.info(
                f"Matched with {len(dto.sources)} providers for album {album_name}"
            )
            context.client.post_external_metadata(dto)
        if release_date:
            # TODO POST Release date
            logging.info(f"Updating release date for album {album_name}")
    except Exception as e:
        logging.error(e)


def match_album(
    album_id: int, album_name: str, artist_name: str | None
) -> tuple[ExternalMetadataDto | None, date | None]:
    context = Context.get()
    release_date: date | None = None
    rating: int | None = None
    (wikidata_id, external_sources) = common.get_sources_from_musicbrainz(
        lambda mb: mb.search_album(album_name, artist_name),
        lambda mb, mbid: mb.get_album(mbid),
        lambda mb, mbid: mb.get_album_url_from_id(mbid),
    )
    description: str | None = None

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + common.get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.providers if p.api_model.id not in sources_ids],
            lambda p: p.get_wikidata_album_relation_key(),
            lambda p, album_id: p.get_album_url_from_id(album_id),
        )

    # Resolve by searching
    sources_ids = [source.provider_id for source in external_sources]
    for provider in [p for p in context.providers if p.api_model.id not in sources_ids]:
        search_res = provider.search_album(album_name, artist_name)
        if not search_res:
            continue
        album_url = provider.get_album_url_from_id(str(search_res.id))
        if not album_url:
            continue
        external_sources.append(
            ExternalMetadataSourceDto(album_url, provider.api_model.id)
        )

    for source in external_sources:
        if description and release_date and rating:
            break
        provider = common.get_provider_from_external_source(source)
        provider_album_id = provider.get_album_id_from_url(source.url)
        if not provider_album_id:
            continue
        album = provider.get_album(provider_album_id)
        if not album:
            continue
        if not rating:
            rating = provider.get_album_rating(album, source.url)
        if not description:
            description = provider.get_album_description(album, source.url)
        if not release_date:
            release_date = provider.get_album_release_date(album, source.url)
    return (
        ExternalMetadataDto(
            description,
            artist_id=None,
            rating=rating,
            album_id=album_id,
            song_id=None,
            sources=external_sources,
        )
        if len(external_sources) > 0 or description or rating
        else None,
        release_date,
    )
