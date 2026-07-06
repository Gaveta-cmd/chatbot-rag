import { Database, FileText, Layers, Cpu } from 'lucide-react'
import type { HealthStatus } from '../types'

interface Props {
  health: HealthStatus | null
  docCount: number
}

export default function StatsBar({ health, docCount }: Props) {
  const stats = [
    {
      icon: FileText,
      label: 'Documents',
      value: docCount,
      color: 'text-accent',
    },
    {
      icon: Layers,
      label: 'Chunks',
      value: health?.total_chunks ?? 0,
      color: 'text-cyan',
    },
    {
      icon: Database,
      label: 'Vector Store',
      value: health ? 'ChromaDB' : '—',
      color: 'text-violet',
    },
    {
      icon: Cpu,
      label: 'LLM',
      value: health?.llm?.model ?? '—',
      color: 'text-success',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
      {stats.map((s, i) => (
        <div key={s.label} className={`glass-card rounded-xl px-4 py-3 stagger-${i + 1}`}>
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-xs text-text-dim uppercase tracking-wider">{s.label}</span>
          </div>
          <p className="text-lg font-heading font-semibold text-text truncate">
            {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
