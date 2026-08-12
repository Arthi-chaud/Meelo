import sys

from matcher.api import API
from matcher.context import Context
from matcher.logger import FATAL, INFO, log
from matcher.models.api.provider import Provider as ProviderApiModel
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.settings import Settings

from .providers.factory import ProviderFactory
from .settings import BaseProviderSettings


# Reads settings, push to API providers that do not exist
# Builds Provider classes and sets up global context
async def bootstrap_context():
    try:
        api_client = API()
        settings = Settings()
        if not await api_client.ping():
            raise Exception("Could not connect to API.")
        log(INFO, "Providers enabled", {"count": len(settings.provider_settings)})
        provider_api_entries = await push_missing_providers(
            (await api_client.get_providers()).items,
            settings.provider_settings,
            api_client,
        )
        resolved_providers = build_provider_models(
            provider_api_entries, settings.provider_settings
        )
        Context.init(api_client, settings, resolved_providers)
    except Exception as e:
        log(FATAL, str(e))
        sys.exit(1)


async def push_missing_providers(
    api_providers: list[ProviderApiModel],
    enabled_providers: list[BaseProviderSettings],
    api_client: API,
):
    created_providers_name = []
    for enabled_provider in enabled_providers:
        if [
            api_prov
            for api_prov in api_providers
            if api_prov.name == enabled_provider.name
        ] == []:
            res = await api_client.post_provider(enabled_provider.name)
            icon_path = f"./assets/{res.slug}/icon.png"
            await api_client.post_provider_icon(res.id, icon_path)
            api_providers.append(res)
    if created_providers_name != []:
        log(
            INFO,
            f"Added {len(created_providers_name)} providers: {created_providers_name}",
        )
    else:
        log(INFO, "Providers up to date.")
    return api_providers


# Builds provider instances from .providers using their settings
def build_provider_models(
    api_models: list[ProviderApiModel], provider_settings: list[BaseProviderSettings]
) -> list[BaseProviderBoilerplate]:
    providers = []
    for provider_setting in provider_settings:
        api_model = [
            entry for entry in api_models if entry.name == provider_setting.name
        ][0]
        providers.append(ProviderFactory.buildProvider(api_model, provider_setting))

    return providers
