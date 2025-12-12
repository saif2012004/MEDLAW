from orchestrator import output_parser
import config


def test_parse_valid_json():
    text = '{"narrative":"done","checklist":["a"],"citations":{"c1":"text"}}'
    result = output_parser.parse_output(text)
    assert result["narrative"] == "done"
    assert result["checklist"] == ["a"]
    assert "citations" in result


def test_parse_markdown_json():
    text = "```json\n{\"narrative\": \"md\"}\n```"
    result = output_parser.parse_output(text)
    assert result["narrative"] == "md"


def test_parse_failure_returns_fallback():
    bad_text = "no json here"
    result = output_parser.parse_output(bad_text)
    assert result["narrative"] == config.PARSE_FAILURE_MESSAGE
    assert result["_parse_status"] == "failed"

