import logging
from matcher.context import Context
from matcher.matcher import common
from matcher.models.api.domain import Label
from matcher.models.api.dto import ExternalMetadataSourceDto, UpdateLabelDto
from matcher.models.match_result import LabelMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate


async def match_and_post_label(label: Label):
    try:
        res = await match_label(label)
        context = Context.get()
        update_dto = UpdateLabelDto(
            start_date=res.start_date,
            end_date=res.end_date,
            area=res.area,
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
        label_model = await provider.get_label(label.mbid) or (
            await provider.get_label_by_name(label.name)
        )
        if label_model is None:
            return

        res.mbid = label.mbid or provider.get_label_mbid(label_model)
        dates = provider.get_label_dates(label_model)
        if dates is not None:
            [res.start_date, res.end_date] = dates

    await common.run_tasks_from_sources(provider_task, [])
    return res
