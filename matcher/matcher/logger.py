import logging
from typing import Dict


DEBUG = logging.DEBUG
INFO = logging.INFO
WARN = logging.WARNING
ERROR = logging.ERROR
FATAL = logging.FATAL

cyan_color = "\x1b[36m"
bold_color = "\x1b[1m"
reset_color = "\x1b[0m"


def trunc(s: str, max_len=30):
    if len(s) < max_len:
        return s
    return s[: max_len - 3] + "..."


def log(level, msg: str, data: Dict[str, str | int] = {}):
    str_data = " ".join(
        [
            f"{cyan_color}%s{reset_color}=%s"
            % (
                "_".join([word.lower() for word in key.split(" ")]),
                f'"{value}"' if any([not c.isalnum() for c in value]) else value,
            )
            for (key, value) in [
                (key, trunc(str(value))) for (key, value) in data.items()
            ]
        ]
    )
    str_msg = f"{bold_color}{msg}{reset_color} {str_data}"
    logging.log(level, str_msg)
