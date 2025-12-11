"""
Prompt Builder Module
Handles prompt composition using Jinja2 templates.
"""

import os
import logging
from typing import List, Dict, Any
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
import config

logger = logging.getLogger(__name__)


class PromptBuilderError(Exception):
    """Custom exception for prompt building errors."""
    pass


class PromptBuilder:
    """
    Builds prompts from Jinja2 templates with context data.
    """
    
    def __init__(self, templates_dir: str = None):
        """
        Initialize the PromptBuilder with a templates directory.
        
        Args:
            templates_dir: Path to the directory containing Jinja2 templates.
                          Defaults to config.PROMPTS_DIR
        """
        self.templates_dir = templates_dir or config.PROMPTS_DIR
        
        if not os.path.exists(self.templates_dir):
            raise PromptBuilderError(
                f"Templates directory not found: {self.templates_dir}"
            )
        
        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        logger.info(f"PromptBuilder initialized with templates from: {self.templates_dir}")
    
    def compose_prompt(
        self,
        template_name: str,
        query: str,
        chunks: List[Dict[str, Any]],
        **kwargs
    ) -> str:
        """
        Compose a prompt using a Jinja2 template.
        
        Args:
            template_name: Name of the template file (e.g., 'qa_prompt.jinja')
            query: The user's query
            chunks: List of retrieved document chunks
            **kwargs: Additional context variables for the template
            
        Returns:
            Rendered prompt string
            
        Raises:
            PromptBuilderError: If template is not found or rendering fails
        """
        try:
            logger.info(f"Composing prompt using template: {template_name}")
            
            # Load the template
            template = self.env.get_template(template_name)
            
            # Prepare context
            context = {
                "query": query,
                "chunks": chunks,
                "num_chunks": len(chunks),
                **kwargs
            }
            
            # Render the template
            prompt = template.render(**context)
            
            logger.debug(f"Prompt composed successfully (length: {len(prompt)} chars)")
            return prompt
            
        except TemplateNotFound:
            logger.error(f"Template not found: {template_name}")
            raise PromptBuilderError(f"Template not found: {template_name}")
            
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {str(e)}")
            raise PromptBuilderError(f"Failed to render template: {str(e)}")
    
    def compose_qa_prompt(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        """
        Compose a Q&A prompt.
        
        Args:
            query: The user's question
            chunks: Retrieved document chunks
            
        Returns:
            Rendered Q&A prompt
        """
        return self.compose_prompt(config.QA_TEMPLATE, query, chunks)
    
    def compose_gap_prompt(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        """
        Compose a gap analysis prompt.
        
        Args:
            query: The gap analysis query
            chunks: Retrieved document chunks
            
        Returns:
            Rendered gap analysis prompt
        """
        return self.compose_prompt(config.GAP_TEMPLATE, query, chunks)
    
    def compose_checklist_prompt(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        """
        Compose a checklist generation prompt.
        
        Args:
            query: The checklist query
            chunks: Retrieved document chunks
            
        Returns:
            Rendered checklist prompt
        """
        return self.compose_prompt(config.CHECKLIST_TEMPLATE, query, chunks)
