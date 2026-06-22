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
            area = await context.client.get_area_by_mbid(res.area.mbid)
            if area is None:
                area = await context.client.post_area(res.area)

        update_dto = UpdateLabelDto(
            start_date=res.start_date.isoformat() if res.start_date else None,
            end_date=res.end_date.isoformat() if res.end_date else None,
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
        label_model = None
        if label.mbid:
            label_model = await provider.get_label_by_mbid(label.mbid)
        if not label_model:
            label_model = await provider.get_label_by_name(label.name)
        if label_model is None:
            return

        res.mbid = label.mbid or provider.get_label_mbid(label_model)
        res.start_date = provider.get_label_start_date(label_model)
        res.end_date = provider.get_label_end_date(label_model)
        res.area = provider.get_label_area(label_model)

    await common.run_tasks_from_sources(provider_task, [])
    return res
