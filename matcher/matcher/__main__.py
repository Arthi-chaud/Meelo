import pika
import os
import sys
import logging
import signal

from pika.adapters.blocking_connection import BlockingChannel
from matcher.bootstrap import bootstrap_context
from matcher.context import Context
from matcher.matcher.album import match_and_post_album
from matcher.matcher.song import match_and_post_song
from matcher.matcher.artist import match_and_post_artist
from .models.event import Event

channel: BlockingChannel | None = None

queue_name = "meelo"


def consume(ch: BlockingChannel, method, prop, body):
    event = Event.from_json(body)
    delivery_tag = method.delivery_tag
    logging.info(f"Received event: {event} (P={prop.priority})")
    match event.type:
        case "artist":
            match_and_post_artist(event.id, event.name)
            ch.basic_ack(delivery_tag)
            pass
        case "album":
            match_and_post_album(event.id, event.name)
            ch.basic_ack(delivery_tag)
            pass
        case "song":
            match_and_post_song(event.id, event.name)
            ch.basic_ack(delivery_tag)
            pass
        case _:
            logging.warning("No handler for event " + event.type)
            pass


def main():
    global channel
    logging.basicConfig(level=logging.INFO)
    rabbitUrl = os.environ.get("RABBITMQ_URL")
    if not rabbitUrl:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    connectionParams = pika.URLParameters(rabbitUrl)
    connection = pika.BlockingConnection(connectionParams)
    channel = connection.channel()
    channel.queue_declare(
        queue=queue_name, durable=True, arguments={"x-max-priority": 5}
    )
    bootstrap_context()

    logging.info(f"Version: {Context.get().settings.version}")
    logging.info("Ready to match!")
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue_name, on_message_callback=consume)
    channel.start_consuming()


def terminate(signal, term):
    logging.info("Shutting Down Matcher...")
    if channel:
        channel.close()
    sys.exit(0)


# From https://www.rabbitmq.com/tutorials/tutorial-one-python
if __name__ == "__main__":
    signal.signal(signal.SIGTERM, terminate)
    main()
