import os
import unittest
from unittest import mock

from scanner import config

WINDOWS_DEFAULT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


class FindTesseractTest(unittest.TestCase):
    def test_explicit_env_always_wins(self):
        with mock.patch.dict(os.environ, {"TESSERACT_CMD": r"D:\alat\tesseract.exe"}):
            self.assertEqual(config._find_tesseract(), r"D:\alat\tesseract.exe")

    def test_empty_means_use_path_when_tesseract_is_on_path(self):
        with mock.patch.dict(os.environ, {"TESSERACT_CMD": ""}), mock.patch.object(
            config.shutil, "which", return_value="/usr/bin/tesseract"
        ):
            self.assertEqual(config._find_tesseract(), "")

    def test_falls_back_to_default_windows_location(self):
        with mock.patch.dict(os.environ, {"TESSERACT_CMD": ""}), mock.patch.object(
            config.shutil, "which", return_value=None
        ), mock.patch.object(config.os.path, "isfile", side_effect=lambda p: p == WINDOWS_DEFAULT):
            self.assertEqual(config._find_tesseract(), WINDOWS_DEFAULT)

    def test_empty_when_nothing_is_found(self):
        with mock.patch.dict(os.environ, {"TESSERACT_CMD": ""}), mock.patch.object(
            config.shutil, "which", return_value=None
        ), mock.patch.object(config.os.path, "isfile", return_value=False):
            self.assertEqual(config._find_tesseract(), "")


if __name__ == "__main__":
    unittest.main()
