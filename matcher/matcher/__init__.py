from fastapi import FastAPI
import logging
from pydantic import BaseModel
from matcher.bootstrap import bootstrap_context
from matcher.context import Context
from pika.adapters.blocking_connection import BlockingChannel
from matcher.matcher.album import match_and_post_album
from matcher.matcher.song import match_and_post_song
from matcher.matcher.artist import match_and_post_artist
from matcher.mq import connect_mq, start_consuming, stop_mq, get_queue_size
from .models.event import Event


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


app = FastAPI(
    title="Meelo's Matcher API",
    description="The matcher is in charge of downloading external metadata (lyrics, images, genres) from providers (e.g. Genius, Wikipedia, etc.)",
    openapi_tags=[{"name": "Endpoints"}],
    swagger_ui_parameters={"syntaxHighlight": True},
    docs_url="/swagger",
)


@app.on_event("startup")
async def startup():
    logging.basicConfig(level=logging.INFO)
    bootstrap_context()
    connect_mq(consume)
    start_consuming()


@app.on_event("shutdown")
async def shutdown():
    stop_mq()


class StatusResponse(BaseModel):
    message: str
    version: str


class QueueResponse(BaseModel):
    queue_size: int


@app.get("/", tags=["Endpoints"])
async def status() -> StatusResponse:
    return StatusResponse(
        message="Matcher is alive.", version=Context.get().settings.version
    )


@app.get("/queue", summary="Get info on the task queue", tags=["Endpoints"])
async def queue() -> QueueResponse:
    return QueueResponse(queue_size=get_queue_size())
