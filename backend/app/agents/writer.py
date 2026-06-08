import json
from typing import Dict, Any
from app.agents.state import AgentState
from app.agents.llm_client import call_llm

def run_writer_agent(state: AgentState) -> Dict[str, Any]:
    """
    Drafts the final markdown report using outline, research data, and uploaded document RAG context.
    """
    topic = state.get("topic", "")
    plan = state.get("plan", {})
    outline = plan.get("outline", [])
    research = state.get("research_findings", [])
    rag = state.get("rag_context", [])
    
    system_prompt = (
        "You are the Writer Agent of an enterprise report generation system. Your goal is to write a detailed, "
        "comprehensive research report on the requested topic based on a structured outline, web research findings, "
        "and document contexts. Use Markdown formatting. Include tables, bullet points, headers, "
        "and clear citation footnotes (e.g. [1], [2]). Make the report extremely professional and comprehensive."
    )
    
    user_prompt = f"Topic: {topic}\n\nOutline Structure:\n"
    for idx, heading in enumerate(outline):
        user_prompt += f"{idx+1}. {heading}\n"
        
    user_prompt += "\nResearch Findings Snippets:\n"
    for idx, item in enumerate(research):
        user_prompt += f"Source [{idx+1}]: {item['title']} ({item['url']}) -> {item['content']}\n"
        
    if rag:
        user_prompt += "\nUser-Uploaded Document Contexts:\n"
        for idx, item in enumerate(rag):
            user_prompt += f"Document Source [{idx+len(research)+1}]: {item['source']} -> {item['content']}\n"
            
    user_prompt += "\nDraft the report now."
    
    draft = call_llm(system_prompt, user_prompt, json_mode=False)
    
    return {
        "draft": draft,
        "current_step": "Drafting completed. Formatting report sections."
    }
