import logging
from matcher.models.api.domain import LocalIdentifiers
from matcher.models.api.dto import ExternalMetadataSourceDto
from matcher.providers.base import BaseFeature
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.providers.domain import SearchResult
from ..context import Context
from typing import Any, Awaitable, Callable, List, Type, TypeVar
from ..providers.wikidata import WikidataProvider
from ..providers.musicbrainz import MusicBrainzProvider
from ..providers.wikipedia import WikipediaProvider
from ..providers.discogs import DiscogsProvider


def get_provider_from_external_source(dto: ExternalMetadataSourceDto):
    return [p for p in Context.get().providers if p.api_model.id == dto.provider_id][0]


async def run_tasks_from_sources(
    f: Callable[
        [ExternalMetadataSourceDto | None, BaseProviderBoilerplate], Awaitable[None]
    ],
    sources: List[ExternalMetadataSourceDto],
):
    async def get_task_or_noop(p: BaseProviderBoilerplate):
        for s in sources:
            if s.provider_id == p.api_model.id:
                await f(s, p)
                return

        await f(None, p)

    await Context.get().run_provider_task(lambda p: get_task_or_noop(p))


async def resolve_data_from_source(
    source: ExternalMetadataSourceDto | None,
    provider: BaseProviderBoilerplate,
    search: Callable[[], Awaitable[SearchResult | None]],
    get: Callable[[str], Awaitable[Any | None]],
    url_to_id: Callable[[str], str | None],
    id_to_url: Callable[[str], str | None],
) -> tuple[ExternalMetadataSourceDto | None, Any | None]:
    data = None
    if source:
        provider_resource_id = id_to_url(source.url)
        if provider_resource_id:
            data = await get(provider_resource_id)
    if not data:
        res = await search()
        if res:
            data = res.data
            provider_resource_url = url_to_id(res.id)
            if provider_resource_url:
                source = ExternalMetadataSourceDto(
                    provider_resource_url, provider.api_model.id
                )
    return (source, data)


F = TypeVar("F", bound=BaseFeature)
D = TypeVar("D")


async def bind_feature_to_result[F, D](
    feature: Type[F],
    provider: BaseProviderBoilerplate,
    guard_data_is_missing: Callable[[], bool],
    get: Callable[[F], Awaitable[D | None]],
    set_result: Callable[[D], None],
):
    f = provider.get_feature(feature)
    if f and guard_data_is_missing():
        res = await get(f)
        if res:
            set_result(res)


async def get_sources_from_wikidata(
    wikidata_id: str,
    missing_providers: List[BaseProviderBoilerplate],
    get_wikidata_relation_key: Callable[[BaseProviderBoilerplate], str | None],
    get_resource_url_from_id: Callable[[BaseProviderBoilerplate, str], str | None],
) -> List[ExternalMetadataSourceDto]:
    wikidata_provider = WikidataProvider()
    wikidata_rels = await wikidata_provider.get_resource_relations(wikidata_id)
    if not wikidata_rels:
        return []
    sources: List[ExternalMetadataSourceDto] = []
    for provider in missing_providers:
        wiki_rel_key = get_wikidata_relation_key(provider)
        if not wiki_rel_key:
            continue
        article_id = wikidata_rels.get_identifier_from_provider_using_relation_key(
            wiki_rel_key
        )
        if not article_id:
            continue
        article_url = get_resource_url_from_id(provider, article_id)
        if article_url:
            sources.append(
                ExternalMetadataSourceDto(article_url, provider.api_model.id)
            )
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
        wiki_article_name = await wikipedia_provider.get_article_name_from_wikidata(
            wikidata_id
        )
        if not wiki_article_name:
            return sources
        article_url = wikipedia_provider.get_article_url_from_id(wiki_article_name)
        if article_url:
            sources.append(
                ExternalMetadataSourceDto(article_url, wikipedia_provider.api_model.id)
            )
    return sources


async def get_sources_from_musicbrainz(
    local_identifiers: LocalIdentifiers,
    mb_search_resource: Callable[[BaseProviderBoilerplate], Awaitable[Any]],
    mb_get_resource: Callable[[BaseProviderBoilerplate, str], Awaitable[Any]],
    mb_get_url_from_id: Callable[[BaseProviderBoilerplate, str], str | None],
) -> tuple[str | None, List[ExternalMetadataSourceDto]]:
    context = Context.get()
    mb_provider = context.get_provider(MusicBrainzProvider)
    if mb_provider is None:
        return (None, [])
    wikidata_id: str | None = None

    resource_mbid: str | None = None
    remaining_providers = [
        p for p in context.get_providers() if p.api_model.id != mb_provider.api_model.id
    ]
    external_sources = []
    if local_identifiers.musicbrainz_id is not None:
        logging.debug("Using local identifier for MusicBrainz")
        resource_mbid = local_identifiers.musicbrainz_id
    else:
        mb_entry = await mb_search_resource(mb_provider)
        if mb_entry is not None:
            resource_mbid = mb_entry.id

    if local_identifiers.discogs_id is not None:
        discogs_provider = context.get_provider(DiscogsProvider)
        discogs_url: str | None = None
        if discogs_provider is not None:
            logging.debug("Using local identifier for Discogs")
            discogs_url = mb_get_url_from_id(
                discogs_provider, local_identifiers.discogs_id
            )
        if discogs_provider is not None and discogs_url is not None:
            remaining_providers = [
                p
                for p in remaining_providers
                if p.api_model.id != discogs_provider.api_model.id
            ]
            external_sources.append(
                ExternalMetadataSourceDto(
                    discogs_url,
                    discogs_provider.api_model.id,
                )
            )

    if resource_mbid is None:
        return (None, external_sources)
    resource_mbid_url = mb_get_url_from_id(mb_provider, resource_mbid)
    if resource_mbid_url is not None:
        external_sources.append(
            ExternalMetadataSourceDto(
                resource_mbid_url,
                mb_provider.api_model.id,
            )
        )
    try:
        resource = await mb_get_resource(mb_provider, resource_mbid)
        if "relations" not in resource.keys():
            return (wikidata_id, external_sources)
        for rel in resource["relations"]:
            if not len(remaining_providers):
                break
            if "url" not in rel:
                continue
            if rel["type"] == "wikidata":
                wikidata_id = rel["url"]["resource"].removeprefix(
                    "https://www.wikidata.org/wiki/"
                )
                continue
            providers = [
                p
                for p in remaining_providers
                if p.get_musicbrainz_relation_key() == rel["type"]
                or p.is_musicbrainz_relation(rel)
            ]
            if not len(providers):
                continue
            provider = providers[0]
            remaining_providers = [
                p
                for p in remaining_providers
                if p.api_model.id != provider.api_model.id
            ]
            provider_id = provider.api_model.id
            if not [
                previous_match
                for previous_match in external_sources
                if previous_match.provider_id == provider_id
            ]:
                external_sources.append(
                    ExternalMetadataSourceDto(rel["url"]["resource"], provider_id)
                )

    except Exception:
        pass
    return (wikidata_id, external_sources)
