from aiormq.abc import AbstractChannel
import aiormq
import logging
import os
from typing import Callable, Any, Coroutine
from matcher.context import Context


channel: AbstractChannel | None = None

queue_name = "meelo"


async def connect_mq(
    on_message_callback: Callable[[Any, AbstractChannel], Coroutine[Any, Any, Any]],
):
    rabbit_url = os.environ.get("RABBITMQ_URL")
    if not rabbit_url:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    global channel
    connection = await aiormq.connect(rabbit_url)
    channel = await connection.channel()
    declare_ok = await channel.queue_declare(
        queue=queue_name,
        durable=True,
        arguments={"x-max-priority": 5},
        auto_delete=False,
        exclusive=False,
    )
    if declare_ok.queue is None:
        logging.error("Couldn't declare queue")
        exit(1)
    logging.info(f"Version: {Context.get().settings.version}")
    logging.info("Ready to match!")
    await channel.basic_qos(prefetch_count=1)
    await channel.basic_consume(
        declare_ok.queue,
        lambda msg: on_message_callback(msg, channel),  # pyright: ignore
    )


async def stop_mq():
    if channel is not None:
        await channel.close()


async def get_queue_size() -> int:
    if not channel:
        return 0
    res = await channel.queue_declare(
        queue=queue_name,
        durable=True,
        arguments={"x-max-priority": 5},
        passive=True,
        auto_delete=False,
        exclusive=False,
    )
    return res.message_count or 0
