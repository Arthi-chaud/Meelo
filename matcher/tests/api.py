import unittest
from unittest import mock
from matcher.api import API
import os


class TestAPI(unittest.TestCase):
    @mock.patch.dict(
        os.environ, {"API_URL": "localhost:4000", "API_KEYS": "abcd,efgh"}, clear=True
    )
    def test_url_and_keys(self):
        api = API()
        self.assertEqual(api._url, "localhost:4000")
        self.assertEqual(api._key, "abcd")

    @mock.patch.dict(os.environ, {"API_KEYS": "abcd,efgh"}, clear=True)
    def test_missing_url(self):
        with self.assertRaises(Exception):
            API()

    @mock.patch.dict(os.environ, {"API_URL": "localhost:4000"}, clear=True)
    def test_missing_key(self):
        with self.assertRaises(Exception):
            API()
