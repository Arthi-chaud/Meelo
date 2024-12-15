import logging

from datetime import date, datetime
from typing import List
from matcher.models.api.dto import ExternalMetadataDto
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


def match_and_post_album(album_id: int, album_name: str):
    try:
        context = Context.get()
        album = context.client.get_album(album_id)
        (dto, release_date, album_type, genres) = match_album(
            album_id, album_name, album.artist_name, album.type
        )
        # We only care about the new album type if the previous type is Studio
        album_type = album_type if album.type == AlbumType.STUDIO and album_type else album.type
        old_release_date = (
            datetime.fromisoformat(album.release_date).date()
            if album.release_date
            else None
        )
        if dto:
            logging.info(
                f"Matched with {len(dto.sources)} providers for album {album_name}"
            )
            context.client.post_external_metadata(dto)

        if old_release_date and release_date:
            if abs(release_date.year - old_release_date.year) > 2:
                logging.info(
                    f"Release date found ({release_date.year}) is too far from the one from the API ({old_release_date.year})."
                )
                logging.info("Probably a mismatch. Ignoring...")
                release_date = None
        if release_date:
            logging.info(f"Updating release date for album {album_name}")
        if genres:
            logging.info(f"Found {len(genres)} genres for album {album_name}")
        if album_type != album.type and album_type != AlbumType.OTHER:
            logging.info(f"Found type for album {album_name}: {album_type.value}")
        if release_date or genres or (album_type != album.type) and album_type != AlbumType.OTHER:
            context.client.post_album_update(album_id, release_date, genres, album_type)
    except Exception as e:
        logging.error(e)


def match_album(
    album_id: int, album_name: str, artist_name: str | None, type: AlbumType
) -> tuple[ExternalMetadataDto | None, date | None, AlbumType | None, List[str]]:
    context = Context.get()
    release_date: date | None = None
    genres: List[str] = []
    rating: int | None = None
    # The type is none if it needs to be found, or sth else if the API already knows it
    album_type: AlbumType | None = None if type == AlbumType.OTHER or type == AlbumType.STUDIO else type
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
        provider = common.get_provider_from_external_source(source)
        is_useful = (
            (not description and provider.has_feature(GetAlbumDescriptionFeature))
            or (not release_date and provider.has_feature(GetAlbumReleaseDateFeature))
            or (not rating and provider.has_feature(GetAlbumRatingFeature))
            or (not album_type and provider.has_feature(GetAlbumTypeFeature))
            or (len(genres) == 0 and provider.has_feature(GetAlbumGenresFeature))
        )
        if not is_useful:
            continue
        provider_album_id = provider.get_album_id_from_url(source.url)
        if not provider_album_id:
            continue
        album = provider.get_album(provider_album_id)
        if not album:
            continue
        if not album_type:
            album_type = provider.get_album_type(album)
        if not rating:
            rating = provider.get_album_rating(album)
        if not description:
            description = provider.get_album_description(album)
        if not release_date:
            release_date = provider.get_album_release_date(album)
        genres = genres + [
            g for g in provider.get_album_genres(album) or [] if g not in genres
        ]
        if description and release_date and rating and genres:
            break
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
        album_type if album_type != type else None,
        genres,
    )
