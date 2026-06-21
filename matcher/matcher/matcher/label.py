import logging
from matcher.context import Context
from matcher.matcher import common
from matcher.models.api.domain import Area, Label
from matcher.models.api.dto import ExternalMetadataSourceDto, UpdateLabelDto
from matcher.models.match_result import LabelMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate


async def match_and_post_label(label: Label):
    try:
        res = await match_label(label)
        context = Context.get()

        area: Area | None = None
        if res.area:
            parent_area = await context.client.get_area_by_mbid(res.area.mbid)
            if parent_area is None:
                parent_area = await context.client.post_area(res.area)

        update_dto = UpdateLabelDto(
            start_date=res.start_date,
            end_date=res.end_date,
            area_id=area.id if area else None,
            mbid=res.mbid,
        )
        await context.client.update_label(label.id, update_dto)
    except Exception as e:
        logging.error(e)


async def match_label(label: Label) -> LabelMatchResult:
    res = LabelMatchResult(start_date=None, end_date=None, area=None, mbid=label.mbid)

    async def provider_task(
        _: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        label_model = (
            await provider.get_label_by_mbid(label.mbid)
            or (await provider.get_label_by_name(label.name))
            if label.mbid
            else await provider.get_label_by_name(label.name)
        )
        if label_model is None:
            return

        res.mbid = label.mbid or provider.get_label_mbid(label_model)
        res.start_date = provider.get_label_start_date(label_model)
        res.end_date = provider.get_label_end_date(label_model)

    await common.run_tasks_from_sources(provider_task, [])
    return res
