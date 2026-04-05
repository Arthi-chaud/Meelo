import logging
from matcher.context import Context
from matcher.matcher import common
from matcher.models.api.domain import Area
from matcher.models.api.dto import ExternalMetadataSourceDto, UpdateAreaDto
from matcher.models.match_result import AreaMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate


async def match_and_post_area(area: Area):
    try:
        res = await match_area(area)
        context = Context.get()
        parent_area: Area | None = None
        if res.parent_area:
            parent_area = await context.client.get_area_by_mbid(res.parent_area.mbid)
            if parent_area is None:
                parent_area = await context.client.post_area(res.parent_area)
        update_dto = UpdateAreaDto(
            parentId=parent_area.id if parent_area else None, type=res.type
        )
        await context.client.update_area(area.id, update_dto)
    except Exception as e:
        logging.error(e)


async def match_area(area: Area) -> AreaMatchResult:
    res = AreaMatchResult(parent_area=None, type=area.type)

    async def provider_task(
        _: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        area_model = await provider.get_area(area.mbid)
        if area_model is None:
            return
        res.type = res.type or provider.get_area_type(area_model)
        res.parent_area = res.parent_area or provider.get_parent_area(area_model)

    await common.run_tasks_from_sources(provider_task, [])
    return res
