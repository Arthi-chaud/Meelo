import pika
import os
import logging

from matcher.bootstrap import bootstrap_context
from matcher.matcher.album import match_and_post_album
from matcher.matcher.artist import match_and_post_artist

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
        delivery_tag = method.delivery_tag
        logging.info(f"Received event: {event}")
        match event.type:
            case "artist":
                match_and_post_artist(event.id, event.name)
                ch.basic_ack(delivery_tag)
                pass
            case "album":
                match_and_post_album(event.id, event.name)
                ch.basic_ack(delivery_tag)
                pass
            case _:
                # logging.warning("No handler for event " + event.type)
                pass

    channel.basic_consume(queue="meelo", on_message_callback=callback)
    logging.basicConfig(level=logging.INFO)
    bootstrap_context()
    logging.info("Ready to match!")
    channel.start_consuming()


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    main()
