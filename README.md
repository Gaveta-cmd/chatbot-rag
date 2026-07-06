# RAG Chatbot — Document Intelligence

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-1.0-FF6F00?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

Chatbot com **Retrieval-Augmented Generation** para conversação inteligente com documentos. Upload PDFs, TXT ou MD e faça perguntas — o sistema busca trechos relevantes via embeddings e gera respostas contextualizadas.

## Features

| Feature | Descrição |
|---------|-----------|
| **Upload de Documentos** | Drag-and-drop de PDF, TXT, MD e CSV com feedback visual |
| **RAG Pipeline** | Chunking + embeddings + similarity search com relevance scoring |
| **Chat Contextual** | Respostas baseadas nos documentos com citação de fontes |
| **Dual LLM** | Suporte a Ollama (local) e OpenRouter (cloud) |
| **Vector Store** | ChromaDB com persistência em disco |
| **Source Attribution** | Chips de fonte com score de relevância em cada resposta |
| **Document Management** | Listagem, contagem de chunks e remoção de documentos |
| **Health Monitor** | Status do LLM, contagem de docs/chunks em tempo real |

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.11+ · FastAPI · Uvicorn |
| RAG Engine | LangChain · HuggingFace Embeddings · ChromaDB |
| LLM | Ollama (local) · OpenRouter (cloud) |
| PDF Parser | PyPDF |
| Frontend | React 19 · TypeScript 5.8 · Vite 6 |
| Styling | Tailwind CSS 4 · Lucide React · Framer Motion |
| HTTP | httpx (async) |

## API Endpoints

| Method | Route | Descrição |
|--------|-------|-----------|
| `POST` | `/api/upload` | Upload e ingestão de documento |
| `POST` | `/api/chat` | Enviar mensagem com RAG |
| `GET` | `/api/documents` | Listar documentos indexados |
| `DELETE` | `/api/documents/:id` | Remover documento do vector store |
| `GET` | `/api/health` | Status da API e conexão LLM |

## Arquitetura

```
chatbot-rag/
├── backend/
│   ├── main.py              # FastAPI app (5 endpoints)
│   ├── rag_engine.py         # RAG pipeline (ChromaDB + embeddings)
│   ├── llm_provider.py       # Ollama/OpenRouter abstraction
│   ├── config.py             # Environment configuration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Layout principal
│   │   ├── api.ts            # API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Tailwind + glass morphism theme
│   │   └── components/
│   │       ├── Header.tsx    # Navbar + health status
│   │       ├── StatsBar.tsx  # 4 stat cards
│   │       ├── DocumentPanel.tsx  # Upload + document list
│   │       └── ChatWindow.tsx     # Chat interface + sources
│   ├── index.html
│   └── vite.config.ts       # Proxy /api → FastAPI
└── README.md
```

## Instalação

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Editar com suas configurações
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

### LLM Setup

**Ollama (padrão):**
```bash
ollama pull llama3.2
```

**OpenRouter (alternativa):**
Edite `.env` com sua API key:
```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
```

## Como Funciona

1. **Upload** → documento é parseado e dividido em chunks de ~1000 caracteres
2. **Embedding** → cada chunk é convertido em vetor via `all-MiniLM-L6-v2`
3. **Indexação** → vetores armazenados no ChromaDB com metadata
4. **Query** → pergunta do usuário é embedada e comparada via similarity search
5. **Context** → top-K chunks relevantes são enviados como contexto ao LLM
6. **Response** → LLM gera resposta baseada nos documentos com citação de fontes
