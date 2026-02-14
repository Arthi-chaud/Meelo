import logging
from typing import List
from matcher.api import API
from matcher.context import Context
from matcher.providers.boilerplate import BaseProviderBoilerplate
from matcher.settings import Settings
from matcher.models.api.provider import Provider as ProviderApiModel
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
        logging.info(f"{len(settings.provider_settings)} providers enabled.")
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
        logging.fatal(e)
        exit(1)


async def push_missing_providers(
    api_providers: List[ProviderApiModel],
    enabled_providers: List[BaseProviderSettings],
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
        logging.info(
            f"Added {len(created_providers_name)} providers: {created_providers_name}"
        )
    else:
        logging.info("Providers up to date.")
    return api_providers


# Builds provider instances from .providers using their settings
def build_provider_models(
    api_models: List[ProviderApiModel], provider_settings: List[BaseProviderSettings]
) -> List[BaseProviderBoilerplate]:
    providers = []
    for provider_setting in provider_settings:
        api_model = [
            entry for entry in api_models if entry.name == provider_setting.name
        ][0]
        providers.append(ProviderFactory.buildProvider(api_model, provider_setting))

    return providers
