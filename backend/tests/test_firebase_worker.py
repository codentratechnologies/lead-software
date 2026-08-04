import pytest
from unittest.mock import MagicMock, patch
from firebase_worker import trigger_webhook

def test_trigger_webhook():
    with patch("firebase_worker.httpx.post") as mock_post:
        with patch.dict("os.environ", {"WEBHOOK_URL": "http://example.com"}):
            lead_data = {"id": "1", "company": {"name": "Test"}}
            trigger_webhook(lead_data, "Test", 90)
            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            assert kwargs["json"]["lead"]["id"] == "1"
            assert kwargs["json"]["event"] == "high_score_lead"
