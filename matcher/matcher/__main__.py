import pika
import os
import logging

from matcher.bootstrap import bootstrap_context
from matcher.matcher.artist import match_artist

from .models.event import Event


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
        # logging.info(f"Received event: {event}")
        match event.type:
            # case "artist":
            #     match_artist(event.id, event.name)
            #     pass
            case _:
                pass
                # logging.warning("No handler for event " + event.type)

    channel.basic_consume(queue="meelo", on_message_callback=callback)
    logging.basicConfig(level=logging.INFO)
    bootstrap_context()
    match_artist(1, "Madonna")
    logging.info("Ready to match!")
    channel.start_consuming()


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()
