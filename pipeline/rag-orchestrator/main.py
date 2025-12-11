"""
Main Runner Script
Demonstrates the RAG Orchestrator in action.
"""

import json
import logging
from orchestrator import run
from orchestrator.rag_orchestrator import RAGOrchestratorError

# Configure logging for demo
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def print_separator(title: str = ""):
    """Print a visual separator."""
    if title:
        print(f"\n{'=' * 80}")
        print(f"  {title}")
        print(f"{'=' * 80}\n")
    else:
        print(f"\n{'-' * 80}\n")


def print_result(result: dict):
    """Pretty print the RAG result."""
    print_separator("RAG ORCHESTRATOR RESULT")
    
    print("📝 NARRATIVE:")
    print(f"   {result['narrative']}\n")
    
    print("✅ CHECKLIST:")
    if result['checklist']:
        for i, item in enumerate(result['checklist'], 1):
            print(f"   {i}. {item}")
    else:
        print("   (No checklist items)")
    print()
    
    print("📚 CITATIONS:")
    if result['citations']:
        for chunk_id, text in result['citations'].items():
            print(f"   • {chunk_id}: {text[:100]}...")
    else:
        print("   (No citations)")
    print()
    
    # Print metadata if available
    if '_metadata' in result:
        print("ℹ️  METADATA:")
        metadata = result['_metadata']
        print(f"   Query: {metadata.get('query', 'N/A')}")
        print(f"   Template: {metadata.get('template_type', 'N/A')}")
        print(f"   Chunks retrieved: {metadata.get('num_chunks_retrieved', 'N/A')}")
        print(f"   Chunks used: {', '.join(metadata.get('chunks_used', []))}")
    
    print_separator()


def demo_qa():
    """Demonstrate Q&A template."""
    print_separator("DEMO 1: Question Answering")
    
    query = "What are the key features of the authentication system?"
    doc_ids = ["doc_auth_001", "doc_security_002"]
    
    print(f"Query: {query}")
    print(f"Documents: {doc_ids}\n")
    
    try:
        result = run(query=query, doc_ids=doc_ids, template_type="qa")
        print_result(result)
        return result
    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration failed: {e}")
        return None


def demo_gap_analysis():
    """Demonstrate gap analysis template."""
    print_separator("DEMO 2: Gap Analysis")
    
    query = "Analyze the documentation for missing security considerations"
    doc_ids = ["doc_security_002", "doc_compliance_003"]
    
    print(f"Query: {query}")
    print(f"Documents: {doc_ids}\n")
    
    try:
        result = run(query=query, doc_ids=doc_ids, template_type="gap")
        print_result(result)
        return result
    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration failed: {e}")
        return None


def demo_checklist():
    """Demonstrate checklist generation template."""
    print_separator("DEMO 3: Checklist Generation")
    
    query = "Create a deployment checklist for the application"
    doc_ids = ["doc_deployment_004", "doc_ops_005"]
    
    print(f"Query: {query}")
    print(f"Documents: {doc_ids}\n")
    
    try:
        result = run(query=query, doc_ids=doc_ids, template_type="checklist")
        print_result(result)
        return result
    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration failed: {e}")
        return None


def interactive_mode():
    """Run in interactive mode."""
    print_separator("INTERACTIVE MODE")
    print("Enter your queries (type 'quit' to exit)\n")
    
    while True:
        try:
            query = input("Query: ").strip()
            if query.lower() in ['quit', 'exit', 'q']:
                print("Exiting interactive mode.")
                break
            
            if not query:
                continue
            
            doc_ids_input = input("Document IDs (comma-separated, or press Enter for default): ").strip()
            if doc_ids_input:
                doc_ids = [doc_id.strip() for doc_id in doc_ids_input.split(',')]
            else:
                doc_ids = ["doc_001", "doc_002"]
            
            template_type = input("Template type (qa/gap/checklist, default=qa): ").strip() or "qa"
            
            print()
            result = run(query=query, doc_ids=doc_ids, template_type=template_type)
            print_result(result)
            
        except KeyboardInterrupt:
            print("\n\nExiting interactive mode.")
            break
        except Exception as e:
            logger.error(f"Error: {e}")


def main():
    """Main entry point."""
    print_separator("RAG ORCHESTRATOR DEMO")
    print("This demo showcases the RAG Orchestrator with different templates.")
    print("Running in MOCK MODE for demonstration (no real API calls required).")
    print()
    print("Available demos:")
    print("  1. Question Answering")
    print("  2. Gap Analysis")
    print("  3. Checklist Generation")
    print("  4. Interactive Mode")
    print("  5. Run All Demos")
    print()
    
    choice = input("Select demo (1-5, or 'q' to quit): ").strip()
    
    if choice == '1':
        demo_qa()
    elif choice == '2':
        demo_gap_analysis()
    elif choice == '3':
        demo_checklist()
    elif choice == '4':
        interactive_mode()
    elif choice == '5':
        demo_qa()
        demo_gap_analysis()
        demo_checklist()
    elif choice.lower() in ['q', 'quit']:
        print("Goodbye!")
    else:
        print("Invalid choice. Please run again and select 1-5.")


if __name__ == "__main__":
    main()
