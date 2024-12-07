from slugify import slugify


def to_slug(s: str) -> str:
    return slugify("".join(s.lower().split()))
