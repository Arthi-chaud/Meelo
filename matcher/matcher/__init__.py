from contextlib import asynccontextmanager
from fastapi import FastAPI
import pika
import os
import logging
from pika.adapters.asyncio_connection import AsyncioConnection
from pika.adapters.blocking_connection import BlockingChannel
from pika.channel import Channel
from matcher import router
from matcher.bootstrap import bootstrap_context
from matcher.context import Context
from matcher.matcher.album import match_and_post_album
from matcher.matcher.song import match_and_post_song
from matcher.matcher.artist import match_and_post_artist
from .models.event import Event

channel: BlockingChannel | None = None

queue_name = "meelo"


def consume(ch: Channel, method, prop, body):
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


def on_channel_open(channel: Channel):
    channel.queue_declare(
        queue=queue_name, durable=True, arguments={"x-max-priority": 5}
    )
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue_name, on_message_callback=consume)
    bootstrap_context()
    logging.info(f"Version: {Context.get().settings.version}")
    logging.info("Ready to match!")


@asynccontextmanager
async def lifespan(_):
    logging.basicConfig(level=logging.INFO)
    rabbitUrl = os.environ.get("RABBITMQ_URL")
    if not rabbitUrl:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    connectionParams = pika.URLParameters(rabbitUrl)
    AsyncioConnection(
        connectionParams,
        on_open_callback=lambda conn: conn.channel(on_open_callback=on_channel_open),
    )
    yield
    logging.info("Shutting Down Matcher...")
    if channel:
        channel.close()


app = FastAPI(
    title="Meelo's Matcher API",
    description="The matcher is in charge of downloading external metadata (lyrics, images, genres) from providers (e.g. Genius, Wikipedia, etc.)",
    openapi_tags=[{"name": "Endpoints"}],
    swagger_ui_parameters={"syntaxHighlight": True},
    lifespan=lifespan,
    docs_url="/swagger",
)
app.include_router(router.router)
