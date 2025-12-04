import asyncio
from typing import Annotated
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import logging
from aiormq.abc import AbstractChannel, DeliveredMessage
from pydantic import BaseModel
from matcher.bootstrap import bootstrap_context
from matcher.context import Context, CurrentItem
from matcher.matcher.album import match_and_post_album
from matcher.matcher.song import match_and_post_song
from matcher.matcher.artist import match_and_post_artist
from matcher.api import User
from matcher.mq import (
    connect_mq,
    stop_mq,
    get_queue_size,
)
from .models.event import Event


match_lock = asyncio.Lock()


async def consume(message: DeliveredMessage, channel: AbstractChannel):
    event = Event.from_json(message.body)
    delivery_tag = message.delivery_tag
    logging.info(f"Received event: {event}")
    await match(event.name, event.type, event.id)
    if delivery_tag is not None:
        await channel.basic_ack(delivery_tag)


async def match(resourceType: str, resourceName: str, resourceId: int):
    async with match_lock:
        ctx = Context.get()
        ctx.current_item = CurrentItem(
            name=resourceName, type=resourceType, id=resourceId
        )
        ctx.pending_items_count = await get_queue_size()
        if ctx.pending_items_count == 0:
            ctx.clear_handled_items_count()
        match resourceType:
            case "artist":
                await match_and_post_artist(resourceId, resourceName)
                ctx.increment_handled_items_count()
                pass
            case "album":
                await match_and_post_album(resourceId, resourceName)
                ctx.increment_handled_items_count()
                pass
            case "song":
                await match_and_post_song(resourceId, resourceName)
                ctx.increment_handled_items_count()
                pass
            case _:
                logging.warning("No handler for resource with type " + resourceType)
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
    await connect_mq(consume)


@app.on_event("shutdown")
async def shutdown():
    await stop_mq()


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


async def get_user_token(req: Request) -> str:
    tokenHeader = req.headers.get("Auhtorization")
    tokenCookie = req.cookies.get("access_token")
    if tokenHeader is not None:
        tokenHeader = tokenHeader.removesuffix("Bearer ")
    token = tokenCookie or tokenHeader
    if not token:
        raise ErrorResponse("Missing token")
    return token


async def get_user(token: Annotated[str, Depends(get_user_token)]) -> User:
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


class MatchDTO(BaseModel):
    artistId: int | None = None
    albumId: int | None = None
    songId: int | None = None


@app.post(
    "/match",
    summary="Refresh external metadata for the given resource",
    tags=["Endpoints"],
)
async def rematch(
    _: Annotated[User, Depends(get_admin_user)],
    token: Annotated[str, Depends(get_user_token)],
    dto: MatchDTO,
) -> None:
    if not dto.artistId and not dto.albumId and not dto.songId:
        raise ErrorResponse("Empty DTO")
    # Intentionally not checking if more than one field is set in the DTO
    ctx = Context.get()
    try:
        if dto.artistId:
            artist = await ctx.client.get_artist(dto.artistId, token)
            await match("artist", artist.name, artist.id)
        if dto.albumId:
            album = await ctx.client.get_album(dto.albumId, token)
            await match("album", album.name, album.id)
        if dto.songId:
            song = await ctx.client.get_song(dto.songId, token)
            await match("song", song.name, song.id)
    except Exception as e:
        raise ErrorResponse(e.__str__())
