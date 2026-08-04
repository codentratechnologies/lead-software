import pytest
from unittest.mock import MagicMock, patch

@pytest.fixture
def mock_httpx_get():
    with patch("app.workers.lead_tasks.httpx.get") as mock_get:
        yield mock_get
