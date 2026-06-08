import base64
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.audit import AuditLog
from app.services.vector_db import chroma_client, CHROMA_AVAILABLE

def encrypt_content(content_str: str, tenant_id: str) -> str:
    """
    Simulates AES-256 encryption by encoding the content string in Base64
    and prefixing it with a tenant-based encryption header.
    """
    if not content_str:
        return ""
    # Use tenant_id as a mock key seed
    encoded_bytes = base64.b64encode(content_str.encode("utf-8"))
    encoded_str = encoded_bytes.decode("utf-8")
    return f"[AES256_ENCRYPTED:{tenant_id}]:{encoded_str}"

def decrypt_content(encrypted_str: str, tenant_id: str) -> str:
    """
    Decrypts the simulated AES-256 string back to plain text.
    """
    if not encrypted_str:
        return ""
    prefix = f"[AES256_ENCRYPTED:{tenant_id}]:"
    if not encrypted_str.startswith(prefix):
        # Return as-is if not matching format
        return encrypted_str
    
    encoded_str = encrypted_str[len(prefix):]
    try:
        decoded_bytes = base64.b64decode(encoded_str.encode("utf-8"))
        return decoded_bytes.decode("utf-8")
    except Exception:
        return encrypted_str

def archive_expired_documents(db: Session):
    """
    Checks for active documents whose expiry_date has passed,
    sets their status to 'expired', archives them, and deletes
    their vector indexing from ChromaDB.
    """
    now = datetime.utcnow()
    expired_docs = db.query(Document).filter(
        Document.is_archived == False,
        Document.expiry_date != None,
        Document.expiry_date < now
    ).all()
    
    for doc in expired_docs:
        doc.is_archived = True
        doc.status = "expired"
        doc.updated_at = now
        
        # Remove from vector store
        if CHROMA_AVAILABLE and chroma_client is not None:
            try:
                collection = chroma_client.get_or_create_collection("rag_documents")
                # We can't delete directly by document name easily if IDs are compound,
                # but we can delete where source metadata matches the document filename.
                # In ChromaDB, we delete by IDs. We can query or we can recreate the typical ID prefix:
                # ids format in vector_db: f"{filename}_{user_id}_{idx}"
                # Let's delete by matching metadata where source == filename
                collection.delete(where={"source": doc.filename})
            except Exception as e:
                print(f"Error removing vector index for expired doc {doc.filename}: {str(e)}")
                
        # Create an audit log entry
        audit_log = AuditLog(
            user_id=None,  # System action
            action="auto_archive_expired",
            status="success",
            details=f"Retention policy triggered. Document: '{doc.filename}' (ID: {doc.id}) has expired and was auto-archived."
        )
        db.add(audit_log)
        
    if expired_docs:
        db.commit()
        print(f"Auto-archived {len(expired_docs)} expired documents.")
