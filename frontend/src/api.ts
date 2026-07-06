import type { DocumentInfo, HealthStatus, Source } from './types'

const BASE = '/api'

export async function uploadDocument(file: File): Promise<{ document: DocumentInfo; message: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function sendMessage(message: string): Promise<{ answer: string; sources: Source[] }> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, top_k: 5 }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Chat failed')
  }
  return res.json()
}

export async function listDocuments(): Promise<{ documents: DocumentInfo[]; total_chunks: number }> {
  const res = await fetch(`${BASE}/documents`)
  return res.json()
}

export async function deleteDocument(docId: string): Promise<void> {
  await fetch(`${BASE}/documents/${docId}`, { method: 'DELETE' })
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE}/health`)
  return res.json()
}
