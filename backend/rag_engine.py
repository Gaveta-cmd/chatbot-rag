from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from pypdf import PdfReader
from pathlib import Path
import hashlib
import uuid

from config import CHROMA_DIR, CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL


class RAGEngine:
    def __init__(self):
        self._embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self._vectorstore = Chroma(
            collection_name="documents",
            embedding_function=self._embeddings,
            persist_directory=str(CHROMA_DIR),
        )
        self._documents: dict[str, dict] = {}

    def _file_hash(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()[:16]

    def _extract_text(self, file_path: Path) -> str:
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            reader = PdfReader(str(file_path))
            return "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        if suffix in (".txt", ".md", ".csv"):
            return file_path.read_text(encoding="utf-8", errors="replace")
        raise ValueError(f"Unsupported file type: {suffix}")

    def ingest(self, file_path: Path, original_name: str) -> dict:
        raw_bytes = file_path.read_bytes()
        file_hash = self._file_hash(raw_bytes)

        if file_hash in self._documents:
            return self._documents[file_hash]

        text = self._extract_text(file_path)
        if not text.strip():
            raise ValueError("Could not extract text from document")

        chunks = self._splitter.split_text(text)
        doc_id = str(uuid.uuid4())[:8]

        documents = [
            Document(
                page_content=chunk,
                metadata={
                    "doc_id": doc_id,
                    "source": original_name,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                },
            )
            for i, chunk in enumerate(chunks)
        ]

        self._vectorstore.add_documents(documents)

        doc_info = {
            "id": doc_id,
            "name": original_name,
            "hash": file_hash,
            "chunks": len(chunks),
            "characters": len(text),
        }
        self._documents[file_hash] = doc_info
        return doc_info

    def search(self, query: str, k: int = 5) -> list[dict]:
        results = self._vectorstore.similarity_search_with_relevance_scores(
            query, k=k
        )
        return [
            {
                "content": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "chunk_index": doc.metadata.get("chunk_index", 0),
                "score": round(score, 4),
            }
            for doc, score in results
            if score > 0.3
        ]

    def get_context(self, query: str, k: int = 5) -> str:
        results = self.search(query, k)
        if not results:
            return ""
        sections = []
        for r in results:
            sections.append(
                f"[Source: {r['source']}]\n{r['content']}"
            )
        return "\n\n---\n\n".join(sections)

    def list_documents(self) -> list[dict]:
        return list(self._documents.values())

    def delete_document(self, doc_id: str) -> bool:
        collection = self._vectorstore._collection
        results = collection.get(where={"doc_id": doc_id})
        if results["ids"]:
            collection.delete(ids=results["ids"])
        self._documents = {
            h: d for h, d in self._documents.items() if d["id"] != doc_id
        }
        return True

    @property
    def total_chunks(self) -> int:
        return self._vectorstore._collection.count()
