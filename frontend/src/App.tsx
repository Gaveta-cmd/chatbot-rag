import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import DocumentPanel from './components/DocumentPanel'
import ChatWindow from './components/ChatWindow'
import { listDocuments, getHealth } from './api'
import type { DocumentInfo, HealthStatus } from './types'

export default function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [health, setHealth] = useState<HealthStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [docs, h] = await Promise.all([listDocuments(), getHealth()])
      setDocuments(docs.documents)
      setHealth(h)
    } catch {
      // API not available yet
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div className="min-h-screen flex flex-col bg-midnight">
      <Header health={health} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-4">
        <StatsBar health={health} docCount={documents.length} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0" style={{ minHeight: 'calc(100vh - 220px)' }}>
          <DocumentPanel documents={documents} onRefresh={refresh} />
          <ChatWindow hasDocuments={documents.length > 0} />
        </div>
      </main>

      <footer className="border-t border-border px-6 py-3 text-center text-xs text-text-dim">
        RAG Chatbot — LangChain + ChromaDB + FastAPI + React
      </footer>
    </div>
  )
}
