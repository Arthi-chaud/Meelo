import pika
import os
import logging
from .models.event import Event
from .api import API
from .settings import Settings


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
            logging.error("Could not connect to API. Exiting...")
            exit(1)
        logging.info(f"{len(settings.provider_settings)} providers enabled.")
        logging.info("Ready to match!")
        channel.start_consuming()
    except Exception as e:
        logging.fatal(e)
        exit(1)


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()