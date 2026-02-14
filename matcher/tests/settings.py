import unittest
from unittest import mock
import os
from matcher.settings import GeniusSettings, MusicBrainzSettings, Settings


class TestSettings(unittest.TestCase):
    @mock.patch.dict(os.environ, {"INTERNAL_CONFIG_DIR": "/config/"}, clear=True)
    @mock.patch("os.path.isfile", return_value=True)
    @mock.patch(
        "builtins.open",
        mock.mock_open(read_data=open("tests/assets/settings.json").read()),
    )
    def test_load_settings(self, _):
        settings = Settings()
        self.assertEqual(len(settings.provider_settings), 2)
        self.assertTrue(settings.push_genres)
        self.assertEqual(
            settings.get_provider_setting(GeniusSettings).api_key,  # type: ignore
            "azerty",
        )
        self.assertIsNotNone(settings.get_provider_setting(MusicBrainzSettings))

    @mock.patch.dict(os.environ, {"INTERNAL_CONFIG_DIR": "/config/"}, clear=True)
    @mock.patch("os.path.isfile", return_value=True)
    @mock.patch(
        "builtins.open",
        mock.mock_open(read_data=open("tests/assets/bad_type.json").read()),
    )
    def test_bad_type(self, _):
        with self.assertRaises(Exception):
            Settings()

    @mock.patch.dict(os.environ, {"INTERNAL_CONFIG_DIR": "/config/"}, clear=True)
    @mock.patch("os.path.isfile", return_value=True)
    @mock.patch(
        "builtins.open",
        mock.mock_open(read_data=open("tests/assets/missing_field.json").read()),
    )
    def test_missing_api_key_field(self, _):
        with self.assertRaises(Exception):
            Settings()
