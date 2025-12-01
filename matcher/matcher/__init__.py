from typing import Annotated
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import logging
from pydantic import BaseModel
from matcher.bootstrap import bootstrap_context
from matcher.context import Context, CurrentItem
from pika.adapters.blocking_connection import BlockingChannel
from matcher.matcher.album import match_and_post_album
from matcher.matcher.song import match_and_post_song
from matcher.matcher.artist import match_and_post_artist
from matcher.api import User
from matcher.mq import (
    connect_mq,
    start_consuming,
    stop_mq,
    get_queue_size,
)
from .models.event import Event


async def consume(ch: BlockingChannel, method, prop, body):
    event = Event.from_json(body)
    ctx = Context.get()
    ctx.pending_items_count = get_queue_size()
    if ctx.pending_items_count == 0:
        ctx.clear_handled_items_count()
    delivery_tag = method.delivery_tag
    logging.info(f"Received event: {event} (P={prop.priority})")
    ctx.current_item = CurrentItem(name=event.name, type=event.type, id=event.id)
    match event.type:
        case "artist":
            await match_and_post_artist(event.id, event.name)
            ch.basic_ack(delivery_tag)
            ctx.increment_handled_items_count()
            pass
        case "album":
            await match_and_post_album(event.id, event.name)
            ctx.increment_handled_items_count()
            ch.basic_ack(delivery_tag)
            pass
        case "song":
            await match_and_post_song(event.id, event.name)
            ctx.increment_handled_items_count()
            ch.basic_ack(delivery_tag)
            pass
        case _:
            logging.warning("No handler for event " + event.type)
            pass
    ctx.current_item = None


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
    logging.getLogger("asyncio").setLevel(logging.ERROR)
    logging.getLogger("pika").setLevel(logging.ERROR)
    await bootstrap_context()
    connect_mq(consume)
    start_consuming()


@app.on_event("shutdown")
async def shutdown():
    stop_mq()


class StatusResponse(BaseModel):
    message: str
    version: str


class QueueResponse(BaseModel):
    handled_items: int
    current_item: CurrentItem | None
    pending_items: int


class ErrorResponse(Exception):
    message: str

    def __init__(self, msg: str):
        self.message = msg


@app.exception_handler(ErrorResponse)
async def error_handler(_: Request, exc: ErrorResponse):
    return JSONResponse({"message": exc.message}, status_code=401)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_user(req: Request) -> User:
    tokenHeader = req.headers.get("Auhtorization")
    tokenCookie = req.cookies.get("access_token")
    if tokenHeader is not None:
        tokenHeader = tokenHeader.removesuffix("Bearer ")
    token = tokenCookie or tokenHeader
    if not token:
        raise ErrorResponse("Missing token")
    user = await Context.get().client.get_user(token)
    if user is None:
        raise ErrorResponse("Invalid token")
    if not user.enabled:
        raise ErrorResponse("User is not enabled")
    return user


async def get_admin_user(user: Annotated[User, Depends(get_user)]) -> User:
    if not user.admin:
        raise ErrorResponse("User is not an admin")
    return user


@app.get("/", tags=["Endpoints"])
async def status() -> StatusResponse:
    return StatusResponse(
        message="Matcher is alive.", version=Context.get().settings.version
    )


@app.get("/queue", summary="Get info on the task queue", tags=["Endpoints"])
async def queue(
    _: Annotated[User, Depends(get_admin_user)],
) -> QueueResponse:
    ctx = Context.get()
    return QueueResponse(
        pending_items=ctx.pending_items_count,
        handled_items=ctx.handled_items_count,
        current_item=ctx.current_item,
    )
