import os
import math
import re
from typing import List, Dict, Any, Optional, Set

# Attempt to load ChromaDB, fallback to InMemory if import fails
CHROMA_AVAILABLE = False
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    pass

class InMemoryVectorStore:
    """
    Fallback vector store implemented in pure Python.
    Uses TF-IDF representation and Cosine Similarity to find relevant chunks.
    """
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.all_words: Set[str] = set()
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Simple word tokenization
        return re.findall(r'\b\w+\b', text.lower())

    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        if not tokens:
            return {}
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
        length = len(tokens)
        return {k: v / length for k, v in tf.items()}

    def _recalculate_idf(self):
        total_docs = len(self.documents)
        if total_docs == 0:
            return
        
        doc_counts = {}
        for doc in self.documents:
            words = set(doc["tf"].keys())
            for word in words:
                doc_counts[word] = doc_counts.get(word, 0) + 1
                
        self.idf = {
            word: math.log((1 + total_docs) / (1 + count)) + 1
            for word, count in doc_counts.items()
        }

    def add_documents(self, chunks: List[Dict[str, Any]]):
        """
        chunks is a list of dicts: {"text": str, "metadata": dict}
        """
        for chunk in chunks:
            tokens = self._tokenize(chunk["text"])
            tf = self._compute_tf(tokens)
            self.documents.append({
                "text": chunk["text"],
                "metadata": chunk.get("metadata", {}),
                "tf": tf
            })
            self.all_words.update(tf.keys())
        self._recalculate_idf()

    def similarity_search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        query_tf = self._compute_tf(query_tokens)
        
        # Calculate Query Vector
        query_vector = {}
        query_len_sq = 0.0
        for token, tf_val in query_tf.items():
            idf_val = self.idf.get(token, 1.0)
            val = tf_val * idf_val
            query_vector[token] = val
            query_len_sq += val * val
        query_len = math.sqrt(query_len_sq)
        
        if query_len == 0:
            # Fallback to returning the first k documents if query is empty or has no matches
            return [{"text": doc["text"], "metadata": doc["metadata"]} for doc in self.documents[:k]]
            
        scored_docs = []
        for doc in self.documents:
            dot_product = 0.0
            doc_len_sq = 0.0
            
            # Calculate document tf-idf length
            for word, tf_val in doc["tf"].items():
                idf_val = self.idf.get(word, 1.0)
                val = tf_val * idf_val
                doc_len_sq += val * val
                if word in query_vector:
                    dot_product += val * query_vector[word]
                    
            doc_len = math.sqrt(doc_len_sq)
            
            if doc_len == 0:
                similarity = 0.0
            else:
                similarity = dot_product / (query_len * doc_len)
                
            scored_docs.append((similarity, doc))
            
        # Sort by similarity descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Return top k results
        return [
            {"text": item[1]["text"], "metadata": item[1]["metadata"], "score": item[0]}
            for item in scored_docs[:k]
        ]


# Singleton style storage instances
fallback_store = InMemoryVectorStore()
chroma_client = None

if CHROMA_AVAILABLE:
    try:
        # Initializing Chroma in persistent/local folder mode
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
    except Exception:
        CHROMA_AVAILABLE = False


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Split long document content into smaller overlapping chunks for RAG.
    """
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks


def add_document_to_store(filename: str, text: str, user_id: str):
    """
    Splits text file content, chunks it, and indexes it into the active vector database.
    """
    chunks = chunk_text(text)
    documents = []
    for idx, chunk in enumerate(chunks):
        documents.append({
            "text": chunk,
            "metadata": {
                "source": filename,
                "user_id": user_id,
                "chunk_id": idx
            }
        })
        
    if CHROMA_AVAILABLE and chroma_client is not None:
        try:
            collection = chroma_client.get_or_create_collection("rag_documents")
            ids = [f"{filename}_{user_id}_{idx}" for idx in range(len(chunks))]
            metadatas = [{"source": filename, "user_id": user_id} for _ in chunks]
            collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )
        except Exception:
            # Fallback to local store on error
            fallback_store.add_documents(documents)
    else:
        fallback_store.add_documents(documents)


def query_vector_store(query: str, user_id: str, k: int = 4) -> List[Dict[str, Any]]:
    """
    Queries the vector database (either Chroma or Fallback store) 
    and returns relevant context matching the query for a specific user.
    """
    if CHROMA_AVAILABLE and chroma_client is not None:
        try:
            collection = chroma_client.get_or_create_collection("rag_documents")
            results = collection.query(
                query_texts=[query],
                n_results=k,
                where={"user_id": user_id}
            )
            
            output = []
            if results and results.get("documents"):
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                for doc, meta in zip(docs, metas):
                    output.append({
                        "text": doc,
                        "metadata": meta
                    })
            return output
        except Exception:
            pass
            
    # Use InMemory fallback search
    results = fallback_store.similarity_search(query, k=k)
    # Filter for the specific user's documents
    user_results = [
        item for item in results
        if item["metadata"].get("user_id") == user_id
    ]
    return user_results
