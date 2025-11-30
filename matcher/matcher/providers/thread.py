from threading import Thread
from queue import Queue
from typing import Awaitable, Callable, TypeAlias, TypeVar
from matcher.providers.boilerplate import BaseProviderBoilerplate
import asyncio
from dataclasses import dataclass

ProviderTask: TypeAlias = Callable[[BaseProviderBoilerplate], Awaitable[None]]

Provider = TypeVar(
    "Provider", bound=BaseProviderBoilerplate, default=BaseProviderBoilerplate
)


class ProviderThread[Provider]:
    provider: Provider
    _thread: Thread
    _queue: Queue

    def __init__(self, p: Provider):
        self.provider = p
        self._queue = Queue()
        self._thread = Thread(
            target=lambda: ProviderThread._consume_queue(self._queue, self.provider),  # pyright: ignore
            daemon=True,
        )
        self._thread.start()

    def process_task(self, f: ProviderTask):
        self._queue.put(f)

    def wait_for_task_end(self):
        self._queue.join()

    @staticmethod
    def _consume_queue(q: Queue, p: BaseProviderBoilerplate):
        while True:
            f: ProviderTask = q.get()
            try:
                asyncio.run(f(p))  # pyright: ignore
            except Exception:
                pass
            q.task_done()


T = TypeVar("T")


@dataclass
class SharedValue[T]:
    def __init__(self, v: T) -> None:
        self.value = v
        self.lock = asyncio.Lock()

    async def to_bool(self, f: Callable[[T], bool]):
        async with self.lock:
            return f(self.value)

    async def update(self, f: Callable[[T], None]):
        async with self.lock:
            f(self.value)

    def unsafe_get_value(self):
        return self.value
