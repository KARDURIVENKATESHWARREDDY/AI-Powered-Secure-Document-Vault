import json
from typing import Dict, Any
from app.agents.state import AgentState
from app.agents.llm_client import call_llm

def run_planning_agent(state: AgentState) -> Dict[str, Any]:
    """
    Decomposes the topic into a structured report outline and plans research queries.
    """
    topic = state.get("topic", "")
    
    system_prompt = (
        "You are the Planning Agent of a multi-agent report generation system. Your goal is to analyze "
        "the requested topic and decompose it into a structured report outline, a list of target search queries "
        "to execute, and key focus concepts. Return your output strictly as a JSON object with keys: "
        "'title' (string), 'outline' (list of strings), 'queries' (list of strings), and 'keywords' (list of strings)."
    )
    
    user_prompt = f"Decompose this topic: '{topic}'"
    
    try:
        response = call_llm(system_prompt, user_prompt, json_mode=True)
        plan_data = json.loads(response)
    except Exception as e:
        # Graceful fallback in case of JSON parsing errors
        plan_data = {
            "title": f"Strategic Analysis of {topic}",
            "outline": ["Executive Summary", "Introduction", "Core Frameworks", "Implications", "Conclusion"],
            "queries": [f"{topic} research", f"{topic} implementation challenges"],
            "keywords": [topic]
        }
        
    return {
        "title": plan_data.get("title", f"Strategic Analysis of {topic}"),
        "plan": plan_data,
        "current_step": "Planning complete. Research queries formulated."
    }
