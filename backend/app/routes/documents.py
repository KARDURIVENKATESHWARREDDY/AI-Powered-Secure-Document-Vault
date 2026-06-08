from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import io

from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentVersion
from app.models.audit import AuditLog
from app.schemas.document import DocumentOut, DocumentExpiryUpdate
from app.security.auth import get_current_user
from app.security.rbac import require_editor, require_viewer
from app.agents.document_workflow import run_document_processing_workflow
from app.services.document_service import decrypt_content
from app.services.vector_db import chroma_client, CHROMA_AVAILABLE

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all active (non-archived) documents for the user's tenant.
    Admin users see all documents in the system.
    """
    if current_user.role == "admin":
        return db.query(Document).filter(Document.is_archived == False).order_by(Document.created_at.desc()).all()
    
    return db.query(Document).filter(
        Document.tenant_id == current_user.tenant_id,
        Document.is_archived == False
    ).order_by(Document.created_at.desc()).all()

@router.get("/{id}", response_model=DocumentOut)
def get_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves metadata for a specific document.
    Enforces tenant boundaries.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role != "admin" and doc.tenant_id != current_user.tenant_id:
        # Create security alert log
        audit_log = AuditLog(
            user_id=current_user.id,
            action="rbac_violation",
            status="blocked",
            details=f"Access denied to doc ID {id}. Tenant mismatch (User: {current_user.tenant_id}, Doc: {doc.tenant_id})"
        )
        db.add(audit_log)
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Tenant boundary restriction.")
        
    return doc

@router.get("/{id}/download")
def download_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates secure decryption and downloads the document content.
    Tracks downloads in the audit log.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role != "admin" and doc.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Tenant boundary restriction.")
        
    # Read encrypted content concept
    # Normally read from disk storage_path. Since we simulate, we retrieve the raw text and decrypt
    decrypted_text = ""
    # In a real environment, we'd open doc.storage_path. Here, let's generate some text with its summary/original state
    decrypted_text = f"SECURE DOCUMENT VAULT - MULTI-TENANT AES-256 SYSTEM\n"
    decrypted_text += f"Document: {doc.filename}\n"
    decrypted_text += f"Owner ID: {doc.owner_id}\n"
    decrypted_text += f"Tenant: {doc.tenant_id}\n"
    decrypted_text += f"Version: {doc.version}\n"
    decrypted_text += f"Status: {doc.status}\n"
    decrypted_text += f"Classification: {doc.category}\n"
    decrypted_text += f"--------------------------------------------------\n\n"
    decrypted_text += f"Summary:\n{doc.summary or 'Processing summary...'}\n\n"
    
    # Log successful download
    audit_log = AuditLog(
        user_id=current_user.id,
        action="download_document",
        status="success",
        details=f"Downloaded document: '{doc.filename}' (ID: {doc.id}). Size: {len(decrypted_text)} chars."
    )
    db.add(audit_log)
    db.commit()
    
    # Return as stream
    file_like = io.BytesIO(decrypted_text.encode("utf-8"))
    return StreamingResponse(
        file_like,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={doc.filename}.txt"}
    )

@router.post("/{id}/version", response_model=DocumentOut)
async def upload_new_version(
    id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor)
):
    """
    Uploads a new version of an existing document.
    Enforces editor/admin RBAC.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role != "admin" and doc.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    # Check supported formats
    filename = file.filename
    if not filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF, DOCX, and TXT are allowed."
        )
        
    # Increment version
    new_version_num = doc.version + 1
    
    # Read content
    content_bytes = await file.read()
    raw_text = content_bytes.decode('utf-8', errors='ignore')
    if filename.endswith('.pdf'):
        # simple layout parsing simulated
        raw_text = f"Simulated text from updated PDF version {new_version_num}: " + raw_text[:5000]
        
    # Delete old vector store entries for this document to ensure RAG only searches the latest version
    if CHROMA_AVAILABLE and chroma_client is not None:
        try:
            collection = chroma_client.get_or_create_collection("rag_documents")
            collection.delete(where={"source": doc.filename})
        except Exception:
            pass
            
    # Update document entry
    doc.version = new_version_num
    doc.status = "processing"
    doc.updated_at = datetime.utcnow()
    
    # Create DocumentVersion history row
    doc_ver = DocumentVersion(
        document_id=doc.id,
        version=new_version_num,
        storage_path=f"./static/secure_vault/{doc.tenant_id}/{doc.id}_v{new_version_num}_{filename}",
        created_by=current_user.id
    )
    db.add(doc_ver)
    db.commit()
    
    # Launch agent workflow in background
    background_tasks.add_task(
        run_document_processing_workflow,
        document_id=doc.id,
        raw_text=raw_text
    )
    
    # Log version audit
    audit_log = AuditLog(
        user_id=current_user.id,
        action="update_document_version",
        status="success",
        details=f"Uploaded new version v{new_version_num} for document: '{doc.filename}'"
    )
    db.add(audit_log)
    db.commit()
    
    return doc

@router.put("/{id}/expiry", response_model=DocumentOut)
def update_retention_policy(
    id: str,
    expiry_in: DocumentExpiryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor)
):
    """
    Updates the document retention and expiry rules.
    Enforces editor/admin RBAC.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role != "admin" and doc.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    # Calculate expiry
    expiry_date = datetime.utcnow() + timedelta(days=expiry_in.expiry_days)
    doc.expiry_date = expiry_date
    db.commit()
    
    # Log retention audit
    audit_log = AuditLog(
        user_id=current_user.id,
        action="update_retention_policy",
        status="success",
        details=f"Configured expiry for document '{doc.filename}' to: {expiry_date.strftime('%Y-%m-%d %H:%M:%S')}"
    )
    db.add(audit_log)
    db.commit()
    
    return doc

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor)
):
    """
    Deletes the document and removes it from Vector DB indexing.
    Enforces editor/admin RBAC.
    """
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if current_user.role != "admin" and doc.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    # Delete from Vector Store
    if CHROMA_AVAILABLE and chroma_client is not None:
        try:
            collection = chroma_client.get_or_create_collection("rag_documents")
            collection.delete(where={"source": doc.filename})
        except Exception:
            pass
            
    # Delete database row (cascades versions)
    filename = doc.filename
    db.delete(doc)
    db.commit()
    
    # Log deletion
    audit_log = AuditLog(
        user_id=current_user.id,
        action="delete_document",
        status="success",
        details=f"Deleted document: '{filename}' and all version entries."
    )
    db.add(audit_log)
    db.commit()
    
    return None
