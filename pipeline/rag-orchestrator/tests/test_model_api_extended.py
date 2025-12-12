import json
import config
from model import model_api


def test_mock_infer_returns_json():
    config.MOCK_MODE = True
    output = model_api.infer("prompt")
    data = json.loads(output)
    assert "narrative" in data
    assert isinstance(data["checklist"], list)

