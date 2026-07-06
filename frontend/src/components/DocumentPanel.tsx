import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { DocumentInfo } from '../types'
import { uploadDocument, deleteDocument } from '../api'

interface Props {
  documents: DocumentInfo[]
  onRefresh: () => void
}

export default function DocumentPanel({ documents, onRefresh }: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const result = await uploadDocument(file)
        showFeedback('success', `${result.document.name}: ${result.document.chunks} chunks indexed`)
      }
      onRefresh()
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onRefresh])

  const handleDelete = async (doc: DocumentInfo) => {
    await deleteDocument(doc.id)
    onRefresh()
    showFeedback('success', `${doc.name} removed`)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="glass-card rounded-2xl p-4 animate-fade-in-up stagger-1">
      <h2 className="font-heading text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        Knowledge Base
      </h2>

      <div
        className={`upload-zone rounded-xl p-4 text-center cursor-pointer mb-3 ${dragOver ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 text-accent mx-auto animate-spin" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-text-dim mx-auto mb-1.5" />
            <p className="text-xs text-text-muted">
              Drop PDF, TXT, MD or CSV
            </p>
          </>
        )}
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3 animate-fade-in-up ${
          feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {feedback.text}
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {documents.length === 0 ? (
          <p className="text-xs text-text-dim text-center py-3">
            No documents yet
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface hover:bg-surface-alt transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-text truncate">{doc.name}</p>
                  <p className="text-xs text-text-dim">{doc.chunks} chunks · {(doc.characters / 1000).toFixed(1)}k chars</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-danger" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
