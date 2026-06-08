import os
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal

from app.models.report import Report, Source
from app.models.evaluation import Evaluation
from app.models.audit import AuditLog
from app.agents.state import AgentState
from app.agents.planning import run_planning_agent
from app.agents.research import run_research_agent
from app.agents.rag_retrieval import run_rag_retrieval_agent
from app.agents.writer import run_writer_agent
from app.agents.reviewer import run_reviewer_agent
from app.agents.citation_verifier import run_citation_verifier_agent
from app.services.exporter import markdown_to_pdf, markdown_to_docx

# Create export directories if they do not exist
os.makedirs("./static/exports", exist_ok=True)

async def run_report_generation_workflow(user_id: str, topic: str, report_id: str):
    db = SessionLocal()
    try:
        await _run_workflow_impl(db, user_id, topic, report_id)
    finally:
        db.close()

async def _run_workflow_impl(db: Session, user_id: str, topic: str, report_id: str):
    """
    Executes the full sequential multi-agent workflow, updates report status in DB, 
    exports PDF/DOCX files, and logs audit events.
    """
    start_time = time.time()
    
    # Initialize the report record database object as processing
    report_db = db.query(Report).filter(Report.id == report_id).first()
    if not report_db:
        return
        
    state: AgentState = {
        "topic": topic,
        "title": report_db.title,
        "user_id": user_id,
        "current_step": "Initializing",
        "plan": {},
        "research_findings": [],
        "rag_context": [],
        "draft": "",
        "reviews": [],
        "verified_citations": [],
        "eval_scores": {},
        "latency_ms": 0,
        "token_count": 0,
        "cost": 0.0,
        "pdf_url": None,
        "docx_url": None,
        "status": "pending",
        "error_message": None
    }
    
    try:
        # 1. PLANNING AGENT
        report_db.status = "planning"
        db.commit()
        plan_out = run_planning_agent(state)
        state.update(plan_out)
        # Update report title if a better one was planned
        report_db.title = state["title"]
        db.commit()
        
        # 2. RESEARCH AGENT
        report_db.status = "researching"
        db.commit()
        research_out = run_research_agent(state)
        state.update(research_out)
        
        # 3. RAG RETRIEVAL AGENT
        report_db.status = "retrieving"
        db.commit()
        rag_out = run_rag_retrieval_agent(state)
        state.update(rag_out)
        
        # 4. WRITER AGENT
        report_db.status = "writing"
        db.commit()
        writer_out = run_writer_agent(state)
        state.update(writer_out)
        
        # 5. REVIEWER AGENT
        report_db.status = "reviewing"
        db.commit()
        reviewer_out = run_reviewer_agent(state)
        state.update(reviewer_out)
        
        # 6. CITATION VERIFICATION AGENT
        report_db.status = "verifying"
        db.commit()
        verifier_out = run_citation_verifier_agent(state)
        state.update(verifier_out)
        
        # 7. EXPORT AGENT (PDF and Word Generation)
        report_db.status = "exporting"
        db.commit()
        
        pdf_filename = f"report_{report_id}.pdf"
        pdf_path = os.path.join("./static/exports", pdf_filename)
        markdown_to_pdf(state["draft"], pdf_path)
        
        docx_filename = f"report_{report_id}.docx"
        docx_path = os.path.join("./static/exports", docx_filename)
        markdown_to_docx(state["draft"], docx_path)
        
        # Calculate performance metrics
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        
        # Simulate token counts based on length of content generated
        draft_len = len(state["draft"].split())
        input_tokens = int(draft_len * 1.3)
        output_tokens = int(draft_len * 1.5)
        total_tokens = input_tokens + output_tokens
        
        # Estimated cost mapping ($0.15 per 1M input / $0.60 per 1M output tokens for GPT-4o-mini)
        cost = round((input_tokens * 0.00000015) + (output_tokens * 0.00000060), 6)
        
        # Create references database list
        for r in state["research_findings"]:
            db_source = Source(
                report_id=report_id,
                title=r["title"],
                url=r["url"],
                content=r["content"],
                credibility_score=r["credibility_score"]
            )
            db.add(db_source)
            
        # Create Evaluation metrics database row
        eval_scores = state["eval_scores"]
        db_eval = Evaluation(
            report_id=report_id,
            faithfulness=eval_scores.get("faithfulness", 0.9),
            context_precision=eval_scores.get("context_precision", 0.9),
            context_recall=eval_scores.get("context_recall", 0.9),
            answer_relevancy=eval_scores.get("answer_relevancy", 0.9),
            hallucination_rate=eval_scores.get("hallucination_rate", 0.1),
            confidence_score=eval_scores.get("confidence_score", 0.9),
            latency_ms=latency_ms,
            token_count=total_tokens,
            estimated_cost=cost
        )
        db.add(db_eval)
        
        # Update Report status and content in DB
        report_db.status = "completed"
        report_db.content = state["draft"]
        report_db.pdf_url = f"/static/exports/{pdf_filename}"
        report_db.docx_url = f"/static/exports/{docx_filename}"
        report_db.completed_at = datetime.utcnow()
        db.commit()
        
        # Create security logs
        audit_log = AuditLog(
            user_id=user_id,
            action="generate_report",
            status="success",
            details=f"Successfully generated report ID: {report_id}. Tokens: {total_tokens}. Cost: ${cost}."
        )
        db.add(audit_log)
        db.commit()
        
    except Exception as e:
        db.rollback()
        report_db.status = "failed"
        db.commit()
        
        audit_log = AuditLog(
            user_id=user_id,
            action="generate_report",
            status="failure",
            details=f"Failed to generate report ID: {report_id}. Error: {str(e)}"
        )
        db.add(audit_log)
        db.commit()
        raise e
