from matcher.context import Context
from matcher.logger import ERROR, INFO, log
from matcher.matcher import common
from matcher.models.api.domain import Series
from matcher.models.api.dto import (
    ExternalMetadataSourceDto,
    UpdateSeriesDto,
)
from matcher.models.match_result import SeriesMatchResult
from matcher.providers.boilerplate import BaseProviderBoilerplate


async def match_and_post_series(series: Series):
    try:
        res = await match_series(series)
        context = Context.get()

        log_data: dict[str, str | int] = {
            "series": series.name,
            "mbid": res.mbid or "none",
        }

        update_dto = UpdateSeriesDto(mbid=res.mbid)
        await context.client.update_series(series.id, update_dto)
        log(INFO, "Matched data", log_data)
    except Exception as e:
        log(ERROR, str(e))


async def match_series(series: Series) -> SeriesMatchResult:
    res = SeriesMatchResult(label=None, mbid=series.mbid)

    async def provider_task(
        _: ExternalMetadataSourceDto | None,
        provider: BaseProviderBoilerplate,
    ):
        series_model = None
        if series.mbid:
            series_model = await provider.get_series_by_mbid(series.mbid)
        if not series_model:
            series_model = await provider.get_series_by_name(series.name)
        if series_model is None:
            return

        res.mbid = series.mbid or provider.get_series_mbid(series_model)

    await common.run_tasks_from_sources(provider_task, [])
    return res
