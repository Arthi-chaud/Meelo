from typing import List
import pika
import os
import logging

from matcher.models.api.provider import Provider
from .models.event import Event
from .api import API
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
        push_missing_providers(
            api_client.get_providers().items, settings.provider_settings, api_client
        )
        logging.info("Ready to match!")
        channel.start_consuming()
    except Exception as e:
        logging.fatal(e)
        exit(1)


def push_missing_providers(
    api_providers: List[Provider],
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
    if created_providers_name != []:
        logging.info(
            f"Added {len(created_providers_name)} providers: {created_providers_name}"
        )
    else:
        logging.info("Providers up to date.")


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()
