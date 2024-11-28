import logging
from typing import List

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from matcher.providers.base import BaseProvider
from matcher.providers.wikidata import WikidataProvider
from matcher.providers.wikipedia import WikipediaProvider
from ..context import Context
from ..providers.musicbrainz import MusicBrainzProvider


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
    (wikidata_id, external_sources) = get_sources_from_musicbrainz(artist_name)
    description: str | None = None

    # Link using Wikidata
    sources_ids = [source.provider_id for source in external_sources]
    if wikidata_id:
        external_sources = external_sources + get_sources_from_wikidata(
            wikidata_id,
            [p for p in context.providers if p.api_model.id not in sources_ids],
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
        provider = get_provider_from_external_source(source)
        if description and artist_illustration_url:
            break
        provider_artist_id = provider.get_artist_id_from_url(source.url)
        if not provider_artist_id:
            continue
        if provider.api_model.name == "Discogs":
            continue
        artist = provider.get_artist(provider_artist_id)
        if not artist:
            continue
        if not description:
            description = provider.get_artist_description(artist, source.url)
        if not artist_illustration_url:
            artist_illustration_url = provider.get_artist_illustration_url(
                artist, source.url
            )
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


def get_provider_from_external_source(dto: ExternalMetadataSourceDto):
    return [p for p in Context.get().providers if p.api_model.id == dto.provider_id][0]


def get_sources_from_musicbrainz(
    artist_name: str,
) -> tuple[str | None, List[ExternalMetadataSourceDto]]:
    context = Context.get()
    mb_provider = context.get_provider(MusicBrainzProvider)
    if mb_provider is None:
        return (None, [])
    wikidata_id: str | None = None
    mbEntry = mb_provider.search_artist(artist_name)
    external_sources = []
    if mbEntry is None:
        return (None, [])
    artist_url = mb_provider.get_artist_url_from_id(mbEntry.id)
    if artist_url:
        external_sources.append(
            ExternalMetadataSourceDto(artist_url, mb_provider.api_model.id)
        )
    try:
        artist = mb_provider.get_artist(mbEntry.id)["artist"]
        if "url-relation-list" not in artist.keys():
            return (wikidata_id, external_sources)
        for rel in mb_provider.get_artist(mbEntry.id)["artist"]["url-relation-list"]:
            if rel["type"] == "wikidata":
                wikidata_id = rel["target"].replace(
                    "https://www.wikidata.org/wiki/", ""
                )
                continue
            providers = [
                p
                for p in context.providers
                if p.get_musicbrainz_relation_key() == rel["type"]
                or p.is_musicbrainz_relation(rel)
            ]
            if not len(providers):
                continue
            provider = providers[0]
            provider_id = provider.api_model.id
            if not [
                previous_match
                for previous_match in external_sources
                if previous_match.provider_id == provider_id
            ]:
                external_sources.append(
                    ExternalMetadataSourceDto(rel["target"], provider_id)
                )
    except Exception:
        pass
    return (wikidata_id, external_sources)


def get_sources_from_wikidata(
    wikidata_id: str, missing_providers: List[BaseProvider]
) -> List[ExternalMetadataSourceDto]:
    wikidata_provider = WikidataProvider()
    wikidata_rels = wikidata_provider.get_resource_relations(wikidata_id)
    if not wikidata_rels:
        return []
    sources: List[ExternalMetadataSourceDto] = []
    for provider in missing_providers:
        wiki_rel_key = provider.get_wikidata_artist_relation_key()
        if not wiki_rel_key:
            continue
        artist_id = wikidata_rels.get_identifier_from_provider_using_relation_key(
            wiki_rel_key
        )
        if not artist_id:
            continue
        artist_url = provider.get_artist_url_from_id(artist_id)
        if artist_url:
            sources.append(ExternalMetadataSourceDto(artist_url, provider.api_model.id))
    # We link Wikipedia manually, using Wikidata
    wikipedia_provider = Context().get().get_provider(WikipediaProvider)
    if not wikipedia_provider:
        return sources
    wikipedia_is_missing = not any(
        [
            source
            for source in sources
            if source.provider_id == wikipedia_provider.api_model.id
        ]
    )
    if wikipedia_is_missing:
        wiki_article_name = wikipedia_provider.get_article_name_from_wikidata(
            wikidata_id
        )
        if not wiki_article_name:
            return sources
        article_url = wikipedia_provider.get_artist_url_from_id(wiki_article_name)
        if article_url:
            sources.append(
                ExternalMetadataSourceDto(article_url, wikipedia_provider.api_model.id)
            )
    return sources
