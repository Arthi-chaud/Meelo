import logging
import os


class Settings:
    def __init__(self):
        self.config_dir = os.environ.get("INTERNAL_CONFIG_DIR")
        if not self.config_dir:
            logging.error("Missing env variable: 'INTERNAL_CONFIG_DIR'")
            exit(1)
        self.config_path = os.path.normpath(f"{self.config_dir}/settings.json")
        if not os.path.isfile(self.config_path):
            logging.error("Could not find settings file")
            exit(1)
        with open(self.config_path) as _:
            logging.info("Reading settings file...")
            logging.info("Settings parsed successfully")