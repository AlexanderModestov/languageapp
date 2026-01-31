"""
Tests for YouTube parser service.

Tests cover:
- Video ID extraction from various URL formats
- Subtitle extraction via YouTube Transcript API
- Audio extraction and transcription via yt-dlp + Whisper
- Error handling and edge cases
"""

import os
import tempfile
from unittest.mock import MagicMock, patch, mock_open

import pytest


class TestExtractVideoId:
    """Tests for extract_video_id function."""

    def test_standard_url(self):
        """Test extraction from standard youtube.com URL."""
        from app.services.yt_parser import extract_video_id

        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_short_url(self):
        """Test extraction from youtu.be short URL."""
        from app.services.yt_parser import extract_video_id

        url = "https://youtu.be/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_embed_url(self):
        """Test extraction from embed URL."""
        from app.services.yt_parser import extract_video_id

        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_url_with_timestamp(self):
        """Test extraction from URL with timestamp parameter."""
        from app.services.yt_parser import extract_video_id

        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_url_with_playlist(self):
        """Test extraction from URL with playlist parameter."""
        from app.services.yt_parser import extract_video_id

        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest123"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_url_without_https(self):
        """Test extraction from URL without https prefix."""
        from app.services.yt_parser import extract_video_id

        url = "www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"

    def test_invalid_url(self):
        """Test extraction returns None for invalid URL."""
        from app.services.yt_parser import extract_video_id

        url = "https://example.com/video"
        assert extract_video_id(url) is None

    def test_malformed_url(self):
        """Test extraction returns None for malformed URL."""
        from app.services.yt_parser import extract_video_id

        url = "not-a-url"
        assert extract_video_id(url) is None

    def test_empty_string(self):
        """Test extraction returns None for empty string."""
        from app.services.yt_parser import extract_video_id

        assert extract_video_id("") is None

    def test_url_with_different_video_id_lengths(self):
        """Test that only 11-character video IDs are matched."""
        from app.services.yt_parser import extract_video_id

        # Valid 11-character ID
        assert extract_video_id("https://youtu.be/abcdefghijk") == "abcdefghijk"
        # Too short (10 chars) - should not match
        assert extract_video_id("https://youtu.be/abcdefghij") is None


class TestGetTranscriptFromApi:
    """Tests for get_transcript_from_api function."""

    @patch("app.services.yt_parser.YouTubeTranscriptApi")
    def test_successful_english_transcript(self, mock_api, sample_transcript_data):
        """Test successful extraction of English transcript."""
        from app.services.yt_parser import get_transcript_from_api

        # Setup mock
        mock_transcript = MagicMock()
        mock_transcript.fetch.return_value = sample_transcript_data

        mock_transcript_list = MagicMock()
        mock_transcript_list.find_transcript.return_value = mock_transcript
        mock_api.list_transcripts.return_value = mock_transcript_list

        result = get_transcript_from_api("dQw4w9WgXcQ")

        assert result is not None
        assert "Hello everyone," in result
        assert "welcome to this video." in result
        assert "Today we'll learn about Python." in result

    @patch("app.services.yt_parser.YouTubeTranscriptApi")
    def test_fallback_to_manual_transcript(self, mock_api, sample_transcript_data):
        """Test fallback to manually created transcript when English not available."""
        from app.services.yt_parser import get_transcript_from_api
        from youtube_transcript_api import NoTranscriptFound

        # Setup mock - English not found, but manual transcript available
        mock_manual_transcript = MagicMock()
        mock_manual_transcript.is_generated = False
        mock_manual_transcript.language = "es"
        mock_manual_transcript.fetch.return_value = sample_transcript_data

        mock_transcript_list = MagicMock()
        mock_transcript_list.find_transcript.side_effect = NoTranscriptFound(
            "dQw4w9WgXcQ", ["en"], {}
        )
        mock_transcript_list.__iter__ = lambda self: iter([mock_manual_transcript])
        mock_api.list_transcripts.return_value = mock_transcript_list

        result = get_transcript_from_api("dQw4w9WgXcQ")

        assert result is not None

    @patch("app.services.yt_parser.YouTubeTranscriptApi")
    def test_fallback_to_auto_generated(self, mock_api, sample_transcript_data):
        """Test fallback to auto-generated transcript."""
        from app.services.yt_parser import get_transcript_from_api
        from youtube_transcript_api import NoTranscriptFound

        # Setup mock - only auto-generated available
        mock_auto_transcript = MagicMock()
        mock_auto_transcript.is_generated = True
        mock_auto_transcript.language = "en"
        mock_auto_transcript.fetch.return_value = sample_transcript_data

        mock_transcript_list = MagicMock()
        mock_transcript_list.find_transcript.side_effect = NoTranscriptFound(
            "dQw4w9WgXcQ", ["en"], {}
        )
        mock_transcript_list.__iter__ = lambda self: iter([mock_auto_transcript])
        mock_api.list_transcripts.return_value = mock_transcript_list

        result = get_transcript_from_api("dQw4w9WgXcQ")

        assert result is not None

    @patch("app.services.yt_parser.YouTubeTranscriptApi")
    def test_no_transcript_available(self, mock_api):
        """Test handling when no transcript is available."""
        from app.services.yt_parser import get_transcript_from_api
        from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled

        mock_api.list_transcripts.side_effect = TranscriptsDisabled("dQw4w9WgXcQ")

        result = get_transcript_from_api("dQw4w9WgXcQ")

        assert result is None

    @patch("app.services.yt_parser.YouTubeTranscriptApi")
    def test_api_error_handling(self, mock_api):
        """Test handling of API errors."""
        from app.services.yt_parser import get_transcript_from_api

        mock_api.list_transcripts.side_effect = Exception("API Error")

        result = get_transcript_from_api("dQw4w9WgXcQ")

        assert result is None


class TestTranscribeWithWhisper:
    """Tests for transcribe_with_whisper function."""

    @patch("app.services.yt_parser.get_settings")
    @patch("app.services.yt_parser.OpenAI")
    @patch("app.services.yt_parser.get_cookies_file_path")
    def test_successful_transcription(
        self, mock_cookies, mock_openai_class, mock_get_settings
    ):
        """Test successful audio download and transcription."""
        from app.services.yt_parser import transcribe_with_whisper

        # Setup mocks
        mock_settings = MagicMock()
        mock_settings.openai_api_key = "test-key"
        mock_get_settings.return_value = mock_settings
        mock_cookies.return_value = None

        mock_client = MagicMock()
        mock_client.audio.transcriptions.create.return_value = "Test transcription"
        mock_openai_class.return_value = mock_client

        # yt_dlp is imported inside the function, so we patch the module directly
        with patch.dict("sys.modules", {"yt_dlp": MagicMock()}) as mock_modules, patch(
            "shutil.which"
        ) as mock_which, patch("os.path.exists") as mock_exists, patch(
            "os.path.getsize"
        ) as mock_getsize, patch(
            "os.listdir"
        ) as mock_listdir, patch(
            "builtins.open", mock_open(read_data=b"audio data")
        ):
            import sys
            mock_yt_dlp = sys.modules["yt_dlp"]

            mock_which.return_value = "/usr/bin/ffmpeg"
            mock_exists.return_value = True
            mock_getsize.return_value = 1024 * 1024  # 1MB
            mock_listdir.return_value = ["test123.mp3"]

            mock_ydl_instance = MagicMock()
            mock_ydl_instance.extract_info.return_value = {"id": "test123"}
            mock_ydl_instance.__enter__ = MagicMock(return_value=mock_ydl_instance)
            mock_ydl_instance.__exit__ = MagicMock(return_value=False)
            mock_yt_dlp.YoutubeDL.return_value = mock_ydl_instance

            result = transcribe_with_whisper("test123")

            assert result == "Test transcription"

    @patch("app.services.yt_parser.get_settings")
    @patch("app.services.yt_parser.OpenAI")
    @patch("app.services.yt_parser.get_cookies_file_path")
    def test_transcription_without_ffmpeg(
        self, mock_cookies, mock_openai_class, mock_get_settings
    ):
        """Test transcription fallback when FFmpeg is not available."""
        from app.services.yt_parser import transcribe_with_whisper

        # Setup mocks
        mock_settings = MagicMock()
        mock_settings.openai_api_key = "test-key"
        mock_get_settings.return_value = mock_settings
        mock_cookies.return_value = None

        mock_client = MagicMock()
        mock_client.audio.transcriptions.create.return_value = "Test transcription"
        mock_openai_class.return_value = mock_client

        with patch.dict("sys.modules", {"yt_dlp": MagicMock()}) as mock_modules, patch(
            "shutil.which"
        ) as mock_which, patch("os.path.exists") as mock_exists, patch(
            "os.path.getsize"
        ) as mock_getsize, patch(
            "builtins.open", mock_open(read_data=b"audio data")
        ):
            import sys
            mock_yt_dlp = sys.modules["yt_dlp"]

            mock_which.return_value = None  # FFmpeg not available
            mock_exists.return_value = True
            mock_getsize.return_value = 1024 * 1024  # 1MB

            mock_ydl_instance = MagicMock()
            mock_ydl_instance.extract_info.return_value = {"id": "test123"}
            mock_ydl_instance.__enter__ = MagicMock(return_value=mock_ydl_instance)
            mock_ydl_instance.__exit__ = MagicMock(return_value=False)
            mock_yt_dlp.YoutubeDL.return_value = mock_ydl_instance

            result = transcribe_with_whisper("test123")

            assert result == "Test transcription"

    @patch("app.services.yt_parser.get_settings")
    @patch("app.services.yt_parser.OpenAI")
    @patch("app.services.yt_parser.get_cookies_file_path")
    def test_download_failure(self, mock_cookies, mock_openai_class, mock_get_settings):
        """Test handling of download failure."""
        from app.services.yt_parser import transcribe_with_whisper

        mock_settings = MagicMock()
        mock_settings.openai_api_key = "test-key"
        mock_get_settings.return_value = mock_settings
        mock_cookies.return_value = None

        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        with patch.dict("sys.modules", {"yt_dlp": MagicMock()}) as mock_modules, patch(
            "shutil.which"
        ) as mock_which:
            import sys
            mock_yt_dlp = sys.modules["yt_dlp"]

            mock_which.return_value = "/usr/bin/ffmpeg"

            mock_ydl_instance = MagicMock()
            mock_ydl_instance.extract_info.side_effect = Exception("Download failed")
            mock_ydl_instance.__enter__ = MagicMock(return_value=mock_ydl_instance)
            mock_ydl_instance.__exit__ = MagicMock(return_value=False)
            mock_yt_dlp.YoutubeDL.return_value = mock_ydl_instance

            result = transcribe_with_whisper("test123")

            assert result is None


class TestExtractTranscript:
    """Tests for main extract_transcript function."""

    @patch("app.services.yt_parser.get_transcript_from_api")
    @patch("app.services.yt_parser.extract_video_id")
    def test_successful_api_extraction(self, mock_extract_id, mock_get_transcript):
        """Test successful transcript extraction via API."""
        from app.services.yt_parser import extract_transcript

        mock_extract_id.return_value = "dQw4w9WgXcQ"
        mock_get_transcript.return_value = "Test transcript from API"

        result = extract_transcript("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

        assert result == "Test transcript from API"
        mock_get_transcript.assert_called_once_with("dQw4w9WgXcQ")

    @patch("app.services.yt_parser.transcribe_with_whisper")
    @patch("app.services.yt_parser.get_transcript_from_api")
    @patch("app.services.yt_parser.extract_video_id")
    def test_fallback_to_whisper(
        self, mock_extract_id, mock_get_transcript, mock_whisper
    ):
        """Test fallback to Whisper when API fails."""
        from app.services.yt_parser import extract_transcript

        mock_extract_id.return_value = "dQw4w9WgXcQ"
        mock_get_transcript.return_value = None  # API fails
        mock_whisper.return_value = "Whisper transcription"

        result = extract_transcript("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

        assert result == "Whisper transcription"
        mock_whisper.assert_called_once_with("dQw4w9WgXcQ")

    @patch("app.services.yt_parser.extract_video_id")
    def test_invalid_url_raises_error(self, mock_extract_id):
        """Test that invalid URL raises ValueError."""
        from app.services.yt_parser import extract_transcript

        mock_extract_id.return_value = None

        with pytest.raises(ValueError) as exc_info:
            extract_transcript("https://example.com/video")

        assert "Invalid YouTube URL" in str(exc_info.value)

    @patch("app.services.yt_parser.transcribe_with_whisper")
    @patch("app.services.yt_parser.get_transcript_from_api")
    @patch("app.services.yt_parser.extract_video_id")
    def test_both_methods_fail(
        self, mock_extract_id, mock_get_transcript, mock_whisper
    ):
        """Test error when both API and Whisper fail."""
        from app.services.yt_parser import extract_transcript

        mock_extract_id.return_value = "dQw4w9WgXcQ"
        mock_get_transcript.return_value = None
        mock_whisper.return_value = None

        with pytest.raises(ValueError) as exc_info:
            extract_transcript("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

        assert "Failed to extract transcript" in str(exc_info.value)


class TestCompressAudio:
    """Tests for compress_audio function."""

    @patch("subprocess.run")
    @patch("shutil.which")
    @patch("os.path.exists")
    @patch("os.path.getsize")
    def test_successful_compression(
        self, mock_getsize, mock_exists, mock_which, mock_run
    ):
        """Test successful audio compression."""
        from app.services.yt_parser import compress_audio

        mock_which.return_value = "/usr/bin/ffmpeg"
        mock_exists.return_value = True
        mock_getsize.return_value = 20 * 1024 * 1024  # 20MB

        # Mock ffprobe for duration
        mock_run.return_value = MagicMock(stdout="300.0\n", returncode=0)

        result = compress_audio("/input.mp3", "/output.mp3")

        assert result is True

    @patch("shutil.which")
    def test_compression_without_ffmpeg(self, mock_which):
        """Test compression fails gracefully without FFmpeg."""
        from app.services.yt_parser import compress_audio

        mock_which.return_value = None

        result = compress_audio("/input.mp3", "/output.mp3")

        assert result is False


class TestSplitAudio:
    """Tests for split_audio function."""

    @patch("subprocess.run")
    @patch("shutil.which")
    @patch("os.path.exists")
    @patch("os.path.getsize")
    def test_successful_split(self, mock_getsize, mock_exists, mock_which, mock_run):
        """Test successful audio splitting."""
        from app.services.yt_parser import split_audio

        mock_which.return_value = "/usr/bin/ffmpeg"
        mock_exists.return_value = True
        mock_getsize.return_value = 5 * 1024 * 1024  # 5MB per chunk

        # Mock ffprobe for duration (15 minutes = should create 2 chunks)
        mock_run.return_value = MagicMock(stdout="900.0\n", returncode=0)

        with tempfile.TemporaryDirectory() as temp_dir:
            result = split_audio("/input.mp3", temp_dir)

            # Should attempt to create chunks
            assert mock_run.called

    @patch("shutil.which")
    def test_split_without_ffmpeg(self, mock_which):
        """Test split fails gracefully without FFmpeg."""
        from app.services.yt_parser import split_audio

        mock_which.return_value = None

        result = split_audio("/input.mp3", "/temp")

        assert result == []


class TestGetCookiesFilePath:
    """Tests for get_cookies_file_path function."""

    def test_direct_file_path(self, tmp_path):
        """Test using direct cookies file path."""
        # Reset global state
        import app.services.yt_parser as yt_parser

        yt_parser._cookies_file_path = None

        # Create an actual temp file
        cookies_file = tmp_path / "cookies.txt"
        cookies_file.write_text("# Netscape HTTP Cookie File\n")

        # Patch at the core.config level where it's imported from
        with patch("app.core.config.get_settings") as mock_get_settings:
            mock_settings = MagicMock()
            mock_settings.youtube_cookies_file = str(cookies_file)
            mock_settings.youtube_cookies_base64 = None
            mock_get_settings.return_value = mock_settings

            # Need to reimport to get fresh function
            import importlib

            importlib.reload(yt_parser)

            result = yt_parser.get_cookies_file_path()

            assert result == str(cookies_file)

    def test_no_cookies_configured(self):
        """Test when no cookies are configured."""
        # Reset global state
        import app.services.yt_parser as yt_parser

        yt_parser._cookies_file_path = None

        with patch("app.core.config.get_settings") as mock_get_settings:
            mock_settings = MagicMock()
            mock_settings.youtube_cookies_file = None
            mock_settings.youtube_cookies_base64 = None
            mock_get_settings.return_value = mock_settings

            import importlib

            importlib.reload(yt_parser)

            result = yt_parser.get_cookies_file_path()

            assert result is None

    def test_base64_cookies(self, tmp_path):
        """Test decoding base64 cookies."""
        import base64

        # Reset global state
        import app.services.yt_parser as yt_parser

        yt_parser._cookies_file_path = None

        cookies_content = "# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\ttest\tvalue"
        encoded_cookies = base64.b64encode(cookies_content.encode()).decode()

        with patch("app.core.config.get_settings") as mock_get_settings:
            mock_settings = MagicMock()
            mock_settings.youtube_cookies_file = None
            mock_settings.youtube_cookies_base64 = encoded_cookies
            mock_get_settings.return_value = mock_settings

            import importlib

            importlib.reload(yt_parser)

            result = yt_parser.get_cookies_file_path()

            # Should return a path to the temp file
            assert result is not None
            assert os.path.exists(result)


# Integration tests (require actual YouTube access - skip by default)
@pytest.mark.skip(reason="Integration test - requires network access")
class TestIntegration:
    """Integration tests with real YouTube URLs."""

    def test_extract_video_id_real_urls(self):
        """Test video ID extraction with real URL formats."""
        from app.services.yt_parser import extract_video_id

        # Test with known working URLs
        assert extract_video_id("https://www.youtube.com/watch?v=jNQXAC9IVRw") == "jNQXAC9IVRw"
        assert extract_video_id("https://youtu.be/jNQXAC9IVRw") == "jNQXAC9IVRw"

    def test_get_transcript_real_video(self):
        """Test transcript extraction from a real video with known subtitles."""
        from app.services.yt_parser import get_transcript_from_api

        # "Me at the zoo" - first YouTube video, has auto-generated captions
        result = get_transcript_from_api("jNQXAC9IVRw")
        # May return None if no transcript available
        if result:
            assert len(result) > 0

    def test_full_extraction_pipeline(self):
        """Test the complete extraction pipeline."""
        from app.services.yt_parser import extract_transcript

        # Use a short video with known subtitles for testing
        try:
            result = extract_transcript("https://www.youtube.com/watch?v=jNQXAC9IVRw")
            assert len(result) > 0
        except ValueError:
            # Expected if no transcript and Whisper fails
            pass
