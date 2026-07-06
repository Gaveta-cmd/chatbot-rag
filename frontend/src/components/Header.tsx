import { Brain, Wifi, WifiOff } from 'lucide-react'
import type { HealthStatus } from '../types'

interface Props {
  health: HealthStatus | null
}

export default function Header({ health }: Props) {
  const llmConnected = health?.llm?.status === 'connected' || health?.llm?.status === 'configured'

  return (
    <header className="border-b border-border px-6 py-4 animate-fade-in-up">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent-dim/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-midnight"
              style={{ backgroundColor: llmConnected ? '#34d399' : '#f87171' }}
            />
          </div>
          <div>
            <h1 className="font-heading text-lg font-semibold gradient-text leading-tight">
              RAG Chatbot
            </h1>
            <p className="text-xs text-text-muted">Document Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {health && (
            <>
              <div className="flex items-center gap-1.5 text-text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>{health.documents_loaded} docs</span>
                <span className="text-text-dim">·</span>
                <span>{health.total_chunks} chunks</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-alt border border-border text-xs">
                {llmConnected ? (
                  <Wifi className="w-3 h-3 text-success" />
                ) : (
                  <WifiOff className="w-3 h-3 text-danger" />
                )}
                <span className="text-text-muted">
                  {health.llm?.provider} · {health.llm?.model}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
