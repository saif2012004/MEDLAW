"""
Output Parser Module
Parses LLM output into structured JSON format with fallback mechanisms.
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional
import config

logger = logging.getLogger(__name__)


class OutputParserError(Exception):
    """Custom exception for output parsing errors."""
    pass


def parse_output(llm_text: str) -> Dict[str, Any]:
    """
    Parse LLM output into structured JSON format.
    
    Expected output format:
    {
        "narrative": "...",
        "checklist": [...],
        "citations": {"doc#chunk": "text"}
    }
    
    Args:
        llm_text: Raw text output from the LLM
        
    Returns:
        Parsed dictionary with narrative, checklist, and citations
        
    Raises:
        OutputParserError: If parsing fails after all attempts
    """
    logger.info("Parsing LLM output")
    
    # Attempt 1: Direct JSON parsing
    result = _try_json_parse(llm_text)
    if result:
        logger.info("Successfully parsed output as JSON")
        return _validate_and_normalize(result)
    
    # Attempt 2: Extract JSON from markdown code blocks
    result = _extract_json_from_markdown(llm_text)
    if result:
        logger.info("Successfully extracted JSON from markdown")
        return _validate_and_normalize(result)
    
    # Attempt 3: Regex-based extraction
    result = _regex_fallback_parse(llm_text)
    if result:
        logger.info("Successfully parsed output using regex fallback")
        return _validate_and_normalize(result)
    
    # All parsing attempts failed
    logger.error("All parsing attempts failed")
    return _create_failure_response(llm_text)


def _try_json_parse(text: str) -> Optional[Dict[str, Any]]:
    """
    Attempt to parse text as JSON directly.
    
    Args:
        text: Text to parse
        
    Returns:
        Parsed dictionary or None if parsing fails
    """
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return None


def _extract_json_from_markdown(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON from markdown code blocks (```json ... ```).
    
    Args:
        text: Text potentially containing markdown code blocks
        
    Returns:
        Parsed dictionary or None if extraction fails
    """
    # Pattern to match ```json ... ``` or ``` ... ```
    patterns = [
        r'```json\s*\n(.*?)\n```',
        r'```\s*\n(.*?)\n```'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
            result = _try_json_parse(json_str)
            if result:
                return result
    
    return None


def _regex_fallback_parse(text: str) -> Optional[Dict[str, Any]]:
    """
    Use regex to extract narrative, checklist, and citations when JSON parsing fails.
    
    Args:
        text: Text to parse
        
    Returns:
        Constructed dictionary or None if extraction fails
    """
    try:
        result = {
            "narrative": "",
            "checklist": [],
            "citations": {}
        }
        
        # Extract narrative (look for common patterns)
        narrative_patterns = [
            r'(?:narrative|answer|response):\s*["\']?(.*?)["\']?(?:\n|$)',
            r'^(.*?)(?=checklist|citations|\[|\{)',
        ]
        
        for pattern in narrative_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                result["narrative"] = match.group(1).strip()
                break
        
        # Extract checklist items (look for bullet points or numbered lists)
        checklist_pattern = r'(?:^|\n)\s*[-*•\d]+[.)]\s*(.+?)(?=\n|$)'
        checklist_items = re.findall(checklist_pattern, text, re.MULTILINE)
        if checklist_items:
            result["checklist"] = [item.strip() for item in checklist_items]
        
        # Extract citations (look for doc#chunk patterns)
        citation_pattern = r'(doc\d+_chunk\d+|[\w\d]+#[\w\d]+):\s*["\']?([^"\n]+)["\']?'
        citations = re.findall(citation_pattern, text)
        if citations:
            result["citations"] = {key: value.strip() for key, value in citations}
        
        # Only return if we extracted at least a narrative
        if result["narrative"]:
            return result
        
        return None
        
    except Exception as e:
        logger.error(f"Regex fallback parsing failed: {str(e)}")
        return None


def _validate_and_normalize(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and normalize the parsed data structure.
    
    Args:
        data: Parsed dictionary
        
    Returns:
        Validated and normalized dictionary
    """
    result = {
        "narrative": "",
        "checklist": [],
        "citations": {}
    }
    
    # Validate narrative
    if "narrative" in data:
        if isinstance(data["narrative"], str):
            result["narrative"] = data["narrative"]
        else:
            result["narrative"] = str(data["narrative"])
    
    # Validate checklist
    if "checklist" in data:
        if isinstance(data["checklist"], list):
            result["checklist"] = [str(item) for item in data["checklist"]]
        elif isinstance(data["checklist"], str):
            # Try to split by newlines or commas
            result["checklist"] = [
                item.strip() 
                for item in re.split(r'[,\n]', data["checklist"]) 
                if item.strip()
            ]
    
    # Validate citations
    if "citations" in data:
        if isinstance(data["citations"], dict):
            result["citations"] = {
                str(k): str(v) for k, v in data["citations"].items()
            }
    
    return result


def _create_failure_response(original_text: str) -> Dict[str, Any]:
    """
    Create a failure response when all parsing attempts fail.
    
    Args:
        original_text: The original LLM output text
        
    Returns:
        Dictionary indicating parsing failure
    """
    return {
        "narrative": config.PARSE_FAILURE_MESSAGE,
        "checklist": [
            "Manual review required",
            "Original output could not be parsed into structured format"
        ],
        "citations": {},
        "_raw_output": original_text[:500],  # Include first 500 chars for debugging
        "_parse_status": "failed"
    }
