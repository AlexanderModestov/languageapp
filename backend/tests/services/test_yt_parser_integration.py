"""
Integration tests for YouTube parser with real URLs.

These tests make actual network requests and require:
- Internet connection
- Optional: YouTube cookies for bot detection bypass
- Optional: OpenAI API key for Whisper fallback

Run with: pytest tests/services/test_yt_parser_integration.py -v -s
"""

import os
import pytest


# Test URLs
# Note: bFC1QGEQ2E8 is DRM protected and cannot be downloaded
TEST_YOUTUBE_URL_DRM = "https://www.youtube.com/watch?v=bFC1QGEQ2E8"

# Use a non-DRM video for testing (short TED talk with subtitles)
TEST_YOUTUBE_URL = "https://www.youtube.com/watch?v=arj7oStGLkU"  # TED talk with captions


class TestYouTubeExtractionIntegration:
    """Integration tests for real YouTube extraction."""

    def test_extract_video_id_from_test_url(self):
        """Test video ID extraction from the test URL."""
        from app.services.yt_parser import extract_video_id

        video_id = extract_video_id(TEST_YOUTUBE_URL)

        assert video_id == "arj7oStGLkU"
        print(f"\n[OK] Video ID extracted: {video_id}")

    def test_get_transcript_from_api(self):
        """Test subtitle extraction via YouTube Transcript API."""
        from app.services.yt_parser import extract_video_id, get_transcript_from_api

        video_id = extract_video_id(TEST_YOUTUBE_URL)
        assert video_id is not None

        transcript = get_transcript_from_api(video_id)

        if transcript:
            print(f"\n[OK] Transcript extracted via API ({len(transcript)} chars)")
            print(f"  First 500 chars: {transcript[:500]}...")
            assert len(transcript) > 0
        else:
            print("\n[WARN] No transcript available via YouTube Transcript API")
            print("  This video may not have subtitles/captions enabled")
            pytest.skip("No transcript available via API - video may not have captions")

    def test_transcribe_with_whisper(self):
        """Test audio extraction and Whisper transcription.

        Requires:
        - yt-dlp installed
        - FFmpeg installed (optional, for audio conversion)
        - OpenAI API key in environment
        """
        from app.services.yt_parser import extract_video_id, transcribe_with_whisper

        # Check if OpenAI API key is configured
        try:
            from app.core.config import get_settings
            settings = get_settings()
            if not settings.openai_api_key:
                pytest.skip("OPENAI_API_KEY not configured")
        except Exception as e:
            pytest.skip(f"Could not load settings: {e}")

        video_id = extract_video_id(TEST_YOUTUBE_URL)
        assert video_id is not None

        print(f"\n[INFO] Downloading audio and transcribing with Whisper...")
        print(f"  Video ID: {video_id}")

        transcript = transcribe_with_whisper(video_id)

        if transcript:
            print(f"\n[OK] Whisper transcription successful ({len(transcript)} chars)")
            print(f"  First 500 chars: {transcript[:500]}...")
            assert len(transcript) > 0
        else:
            print("\n[FAIL] Whisper transcription failed")
            pytest.fail("Whisper transcription returned None")

    def test_extract_transcript_full_pipeline(self):
        """Test the complete extraction pipeline (API with Whisper fallback).

        This is the main function used by the materials router.
        """
        from app.services.yt_parser import extract_transcript

        print(f"\n[INFO] Testing full extraction pipeline for: {TEST_YOUTUBE_URL}")

        try:
            transcript = extract_transcript(TEST_YOUTUBE_URL)

            print(f"\n[OK] Transcript extracted successfully ({len(transcript)} chars)")
            print(f"  First 500 chars: {transcript[:500]}...")

            assert transcript is not None
            assert len(transcript) > 0

        except ValueError as e:
            print(f"\n[FAIL] Extraction failed: {e}")
            pytest.fail(f"extract_transcript raised ValueError: {e}")


class TestYouTubeAudioDownload:
    """Tests specifically for audio download functionality."""

    def test_yt_dlp_download(self):
        """Test raw yt-dlp audio download without transcription."""
        import tempfile
        import shutil

        try:
            import yt_dlp
        except ImportError:
            pytest.skip("yt-dlp not installed")

        from app.services.yt_parser import extract_video_id, get_cookies_file_path

        video_id = extract_video_id(TEST_YOUTUBE_URL)
        assert video_id is not None

        ffmpeg_available = shutil.which("ffmpeg") is not None
        print(f"\n[INFO] Testing yt-dlp download...")
        print(f"  Video ID: {video_id}")
        print(f"  FFmpeg available: {ffmpeg_available}")

        with tempfile.TemporaryDirectory() as temp_dir:
            if ffmpeg_available:
                ydl_opts = {
                    "format": "bestaudio/best",
                    "postprocessors": [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "mp3",
                            "preferredquality": "64",
                        }
                    ],
                    "outtmpl": f"{temp_dir}/{video_id}.%(ext)s",
                    "quiet": False,
                    "no_warnings": False,
                }
            else:
                ydl_opts = {
                    "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
                    "outtmpl": f"{temp_dir}/{video_id}.%(ext)s",
                    "quiet": False,
                    "no_warnings": False,
                }

            # Add cookies if available
            cookies_path = get_cookies_file_path()
            if cookies_path:
                ydl_opts["cookiefile"] = cookies_path
                print(f"  Using cookies file: {cookies_path}")

            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(
                        f"https://www.youtube.com/watch?v={video_id}",
                        download=True
                    )

                    print(f"\n[OK] Video info extracted:")
                    print(f"  Title: {info.get('title', 'N/A')}")
                    print(f"  Duration: {info.get('duration', 'N/A')} seconds")
                    print(f"  Uploader: {info.get('uploader', 'N/A')}")

                # Check for downloaded file
                import os
                files = os.listdir(temp_dir)
                print(f"\n  Downloaded files: {files}")

                audio_file = None
                for ext in ["mp3", "m4a", "webm", "opus", "ogg", "wav"]:
                    potential_path = f"{temp_dir}/{video_id}.{ext}"
                    if os.path.exists(potential_path):
                        audio_file = potential_path
                        file_size = os.path.getsize(potential_path)
                        print(f"\n[OK] Audio file found: {potential_path}")
                        print(f"  Size: {file_size / 1024 / 1024:.2f} MB")
                        break

                if audio_file:
                    assert os.path.getsize(audio_file) > 0
                else:
                    pytest.fail(f"No audio file found. Files in temp dir: {files}")

            except Exception as e:
                print(f"\n[FAIL] yt-dlp download failed: {e}")
                pytest.fail(f"yt-dlp download failed: {e}")


class TestUserProvidedVideo:
    """Tests for the user-provided video URL."""

    def test_user_video_transcript_api(self):
        """Test transcript extraction via API for user's video."""
        from app.services.yt_parser import extract_video_id, get_transcript_from_api

        video_id = extract_video_id(TEST_YOUTUBE_URL_DRM)
        assert video_id == "bFC1QGEQ2E8"

        transcript = get_transcript_from_api(video_id)

        print(f"\n[INFO] User video transcript result: {transcript is not None}")
        if transcript:
            print(f"  Transcript found ({len(transcript)} chars)")
            print(f"  First 200 chars: {transcript[:200]}...")
        else:
            print("  No transcript available via API - will try Whisper")

    def test_user_video_full_extraction(self):
        """Test full extraction pipeline for user's video."""
        from app.services.yt_parser import extract_transcript

        print(f"\n[INFO] Testing extraction for user's video: {TEST_YOUTUBE_URL_DRM}")

        try:
            transcript = extract_transcript(TEST_YOUTUBE_URL_DRM)
            print(f"\n[OK] Transcript extracted ({len(transcript)} chars)")
            print(f"  First 500 chars: {transcript[:500]}...")
            assert len(transcript) > 0
        except ValueError as e:
            print(f"\n[FAIL] Extraction failed: {e}")
            pytest.fail(f"Could not extract transcript: {e}")


class TestDiagnostics:
    """Diagnostic tests to identify extraction issues."""

    def test_check_dependencies(self):
        """Check if all required dependencies are available."""
        import shutil

        print("\n[INFO] Checking dependencies...")

        # Check yt-dlp
        try:
            import yt_dlp
            print(f"  [OK] yt-dlp: {yt_dlp.version.__version__}")
        except ImportError:
            print("  [FAIL] yt-dlp: NOT INSTALLED")

        # Check FFmpeg
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            print(f"  [OK] FFmpeg: {ffmpeg_path}")
        else:
            print("  [WARN] FFmpeg: NOT FOUND (audio conversion will be limited)")

        # Check ffprobe
        ffprobe_path = shutil.which("ffprobe")
        if ffprobe_path:
            print(f"  [OK] ffprobe: {ffprobe_path}")
        else:
            print("  [WARN] ffprobe: NOT FOUND (needed for audio compression)")

        # Check youtube-transcript-api
        try:
            import youtube_transcript_api
            print(f"  [OK] youtube-transcript-api: installed")
        except ImportError:
            print("  [FAIL] youtube-transcript-api: NOT INSTALLED")

        # Check OpenAI
        try:
            import openai
            print(f"  [OK] openai: {openai.__version__}")
        except ImportError:
            print("  [FAIL] openai: NOT INSTALLED")

        # Check OpenAI API key
        try:
            from app.core.config import get_settings
            settings = get_settings()
            if settings.openai_api_key:
                print(f"  [OK] OPENAI_API_KEY: configured ({settings.openai_api_key[:10]}...)")
            else:
                print("  [WARN] OPENAI_API_KEY: NOT SET")
        except Exception as e:
            print(f"  [WARN] Could not check settings: {e}")

        # Check cookies
        try:
            from app.services.yt_parser import get_cookies_file_path
            cookies_path = get_cookies_file_path()
            if cookies_path:
                print(f"  [OK] YouTube cookies: {cookies_path}")
            else:
                print("  [WARN] YouTube cookies: NOT CONFIGURED (may hit bot detection)")
        except Exception as e:
            print(f"  [WARN] Could not check cookies: {e}")

    def test_list_available_transcripts(self):
        """List all available transcripts for the test video."""
        from youtube_transcript_api import YouTubeTranscriptApi

        from app.services.yt_parser import extract_video_id

        video_id = extract_video_id(TEST_YOUTUBE_URL)
        assert video_id is not None

        print(f"\n[INFO] Checking available transcripts for {video_id}...")

        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            print("\n  Available transcripts:")
            for transcript in transcript_list:
                auto_gen = "(auto-generated)" if transcript.is_generated else "(manual)"
                print(f"    - {transcript.language_code}: {transcript.language} {auto_gen}")

        except Exception as e:
            print(f"\n  [WARN] Could not list transcripts: {e}")
            print("  This video may not have any transcripts available")
