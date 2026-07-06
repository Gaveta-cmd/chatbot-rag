export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
}

export interface Source {
  content: string
  source: string
  chunk_index: number
  score: number
}

export interface DocumentInfo {
  id: string
  name: string
  hash: string
  chunks: number
  characters: number
}

export interface HealthStatus {
  api: string
  documents_loaded: number
  total_chunks: number
  llm: {
    provider: string
    status: string
    model: string
    available_models?: string[]
  }
}
