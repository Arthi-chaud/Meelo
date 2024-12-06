import logging

from jsons import date

from matcher.models.api.dto import ExternalMetadataDto

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
    return (None, None)
