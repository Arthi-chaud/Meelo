from typing import List
import pika
import os
import logging

from matcher.models.api.provider import Provider as ProviderApiModel
from .models.event import Event
from .providers.base import BaseProvider
from .providers.factory import ProviderFactory
from .api import API
from .context import Context
from .settings import BaseProviderSettings, Settings


def main():
    rabbitUrl = os.environ.get("RABBITMQ_URL")
    if not rabbitUrl:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    connectionParams = pika.URLParameters(rabbitUrl)
    connection = pika.BlockingConnection(connectionParams)
    channel = connection.channel()
    channel.queue_declare(queue="meelo", durable=True)

    def callback(ch, method, properties, body):
        event = Event.from_json(body)
        logging.info(f"{event}")

    channel.basic_consume(queue="meelo", on_message_callback=callback)
    logging.basicConfig(level=logging.INFO)
    try:
        api_client = API()
        settings = Settings()
        if not api_client.ping():
            raise Exception("Could not connect to API.")
        logging.info(f"{len(settings.provider_settings)} providers enabled.")
        provider_api_entries = push_missing_providers(
            api_client.get_providers().items, settings.provider_settings, api_client
        )
        resolved_providers = build_provider_models(
            provider_api_entries, settings.provider_settings
        )
        Context.init(api_client, settings, resolved_providers)
        logging.info("Ready to match!")
        channel.start_consuming()
    except Exception as e:
        logging.fatal(e)
        exit(1)


def push_missing_providers(
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
            res = api_client.post_provider(enabled_provider.name)
            icon_path = f"./assets/{res.slug}/icon.png"
            api_client.post_provider_icon(res.id, icon_path)
            api_providers.append(res)
    if created_providers_name != []:
        logging.info(
            f"Added {len(created_providers_name)} providers: {created_providers_name}"
        )
    else:
        logging.info("Providers up to date.")
    return api_providers


def build_provider_models(
    api_models: List[ProviderApiModel], provider_settings: List[BaseProviderSettings]
) -> List[BaseProvider]:
    providers = []
    for provider_setting in provider_settings:
        api_model = [
            entry for entry in api_models if entry.name == provider_setting.name
        ][0]
        providers.append(ProviderFactory.buildProvider(api_model, provider_setting))

    return providers


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()
