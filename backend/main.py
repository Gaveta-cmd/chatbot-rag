from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import shutil

from config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB
from rag_engine import RAGEngine
from llm_provider import generate_response, check_llm_health

app = FastAPI(title="RAG Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".csv"}


class ChatRequest(BaseModel):
    message: str
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


@app.post("/api/upload")
async def upload_document(file: UploadFile):
    if not file.filename:
        raise HTTPException(400, "No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(400, f"File exceeds {MAX_UPLOAD_SIZE_MB}MB limit")

    save_path = UPLOAD_DIR / file.filename
    save_path.write_bytes(content)

    try:
        doc_info = rag.ingest(save_path, file.filename)
    except ValueError as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(400, str(e))

    return {
        "status": "success",
        "document": doc_info,
        "message": f"Ingested {doc_info['chunks']} chunks from {file.filename}",
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    context = rag.get_context(req.message, k=req.top_k)
    sources = rag.search(req.message, k=req.top_k)

    try:
        answer = await generate_response(req.message, context)
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")

    return ChatResponse(answer=answer, sources=sources)


@app.get("/api/documents")
async def list_documents():
    return {
        "documents": rag.list_documents(),
        "total_chunks": rag.total_chunks,
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    rag.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}


@app.get("/api/health")
async def health_check():
    llm_status = await check_llm_health()
    return {
        "api": "running",
        "documents_loaded": len(rag.list_documents()),
        "total_chunks": rag.total_chunks,
        "llm": llm_status,
    }
