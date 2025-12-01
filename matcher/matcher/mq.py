import pika
import asyncio
import logging
import os
from typing import Awaitable, Callable, Any
from matcher.context import Context
from pika.adapters.blocking_connection import BlockingChannel


channel: BlockingChannel | None = None

queue_name = "meelo"


def connect_mq(
    on_message_callback: Callable[[BlockingChannel, Any, Any, Any], Awaitable[None]],
):
    global channel
    rabbitUrl = os.environ.get("RABBITMQ_URL")
    if not rabbitUrl:
        logging.error("Missing env var 'RABBITMQ_URL'")
        exit(1)
    connectionParams = pika.URLParameters(rabbitUrl)
    connection = pika.BlockingConnection(connectionParams)
    channel = connection.channel()
    channel.queue_declare(
        queue=queue_name,
        durable=True,
        arguments={"x-max-priority": 5},
        auto_delete=False,
        exclusive=False,
    )

    logging.info(f"Version: {Context.get().settings.version}")
    logging.info("Ready to match!")
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue_name,
        on_message_callback=lambda bc, arg1, arg2, arg3: asyncio.run(
            (
                on_message_callback(bc, arg1, arg2, arg3)  # pyright: ignore
            )
        ),
    )


def start_consuming():
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, lambda: channel and channel.start_consuming())


def stop_mq():
    if channel is not None:
        channel.stop_consuming()
        channel.close()


def get_queue_size() -> int:
    if not channel:
        return 0
    res = channel.queue_declare(
        queue=queue_name,
        durable=True,
        arguments={"x-max-priority": 5},
        passive=True,
        auto_delete=False,
        exclusive=False,
    )

    return res.method.message_count
