from typing import Dict, Any
from app.agents.state import AgentState
from app.services.vector_db import query_vector_store

def run_rag_retrieval_agent(state: AgentState) -> Dict[str, Any]:
    """
    Retrieves user-uploaded file context from the vector database 
    and appends it to the RAG context for report generation.
    """
    topic = state.get("topic", "")
    user_id = state.get("user_id", "")
    
    # Query vector store for chunks matching the report topic
    matching_chunks = query_vector_store(query=topic, user_id=user_id, k=4)
    
    rag_context = []
    for chunk in matching_chunks:
        rag_context.append({
            "source": chunk["metadata"].get("source", "Uploaded Document"),
            "content": chunk["text"],
            "score": chunk.get("score", 1.0)
        })
        
    return {
        "rag_context": rag_context,
        "current_step": f"RAG search completed. Extracted {len(rag_context)} matching context chunks from uploaded files."
    }
