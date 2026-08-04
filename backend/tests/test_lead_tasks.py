import pytest
from unittest.mock import MagicMock, patch
from app.workers.lead_tasks import scrape_website, analyze_and_score_lead

def test_scrape_website_success(mock_httpx_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><body><p>Hello world!</p></body></html>"
    mock_httpx_get.return_value = mock_response

    result = scrape_website("https://example.com")
    assert "Hello world!" in result
    mock_httpx_get.assert_called()

def test_scrape_website_http_error(mock_httpx_get):
    import httpx
    mock_httpx_get.side_effect = httpx.HTTPError("Connection failed")
    
    result = scrape_website("https://example.com")
    assert result == "" # Should handle error gracefully and return empty string

def test_analyze_and_score_lead():
    with patch("app.workers.lead_tasks.genai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '```json\n{"contact_person": "John Doe", "email": "john@example.com", "phone": "123", "problems_identified": "none", "recommended_solution": "none", "lead_score": 85, "tech_stack": ["React"]}\n```'
        mock_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_instance
        
        result = analyze_and_score_lead("query", "some website text")
        
        assert result["contact_person"] == "John Doe"
        assert result["email"] == "john@example.com"
        assert result["lead_score"] == 85
        assert "React" in result["tech_stack"]

def test_analyze_and_score_lead_malformed_json():
    with patch("app.workers.lead_tasks.genai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = 'This is not json at all!'
        mock_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_instance
        
        result = analyze_and_score_lead("query", "some text")
        
        # It should fallback to safe defaults rather than crashing
        assert result["lead_score"] == 50
        assert result["contact_person"] == ""
