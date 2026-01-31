"""Pytest configuration and fixtures for the test suite."""

import os
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_settings():
    """Create mock settings object."""
    settings = MagicMock()
    settings.openai_api_key = "test-api-key"
    settings.youtube_cookies_file = None
    settings.youtube_cookies_base64 = None
    return settings


@pytest.fixture
def mock_openai_client():
    """Create mock OpenAI client."""
    client = MagicMock()
    client.audio.transcriptions.create.return_value = "This is a test transcription from Whisper."
    return client


@pytest.fixture
def sample_transcript_data():
    """Sample transcript data from YouTube Transcript API."""
    return [
        {"text": "Hello everyone,", "start": 0.0, "duration": 1.5},
        {"text": "welcome to this video.", "start": 1.5, "duration": 2.0},
        {"text": "Today we'll learn about Python.", "start": 3.5, "duration": 2.5},
    ]


@pytest.fixture
def sample_youtube_urls():
    """Various YouTube URL formats for testing."""
    return {
        "standard": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "short": "https://youtu.be/dQw4w9WgXcQ",
        "embed": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "with_params": "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120",
        "with_list": "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest123",
        "invalid": "https://example.com/video",
        "malformed": "not-a-url",
    }


@pytest.fixture
def temp_audio_file(tmp_path):
    """Create a temporary audio file for testing."""
    audio_file = tmp_path / "test_audio.mp3"
    # Create a minimal valid MP3 header (not a real audio file, but enough for file existence tests)
    audio_file.write_bytes(b"\xff\xfb\x90\x00" + b"\x00" * 1000)
    return str(audio_file)
