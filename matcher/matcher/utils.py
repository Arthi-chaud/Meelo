import asyncio
from typing import Any, Callable, TypeVar
from slugify import slugify


def to_slug(s: str) -> str:
    return slugify("".join(s.lower().split())).replace("-", "")


def capitalize_all_words(s: str) -> str:
    res = []
    for word in s.split():
        word = word.capitalize()
        for c in ["&", "-", "/"]:
            if c in word:
                word = c.join([capitalize_all_words(w) for w in word.split(c)])
        res.append(word)
    return " ".join(res)


T = TypeVar("T")


async def asyncify(f: Callable[[], T] | Any, *kwargs) -> T:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, f, *kwargs)
