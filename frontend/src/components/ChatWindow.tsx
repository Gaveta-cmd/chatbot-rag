import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, FileSearch, Copy, Check } from 'lucide-react'
import type { Message, Source } from '../types'
import { sendMessage } from '../api'

interface Props {
  hasDocuments: boolean
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-lg bg-accent-dim/20 flex items-center justify-center shrink-0">
        <FileSearch className="w-4 h-4 text-accent" />
      </div>
      <div className="chat-bubble-bot px-4 py-3 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
        <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
        <div className="w-2 h-2 rounded-full bg-accent typing-dot" />
      </div>
    </div>
  )
}

function SourceChips({ sources }: { sources: Source[] }) {
  if (!sources.length) return null
  const unique = [...new Map(sources.map(s => [s.source, s])).values()]
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {unique.map((s) => (
        <span
          key={s.source}
          className="source-chip text-xs px-2 py-0.5 rounded-md text-accent-bright"
          title={`Relevance: ${(s.score * 100).toFixed(0)}%`}
        >
          {s.source}
        </span>
      ))}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`flex items-start gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isUser ? 'bg-accent-dim/30' : 'bg-accent-dim/20'
      }`}>
        {isUser ? (
          <span className="text-xs font-semibold text-accent-bright">You</span>
        ) : (
          <FileSearch className="w-4 h-4 text-accent" />
        )}
      </div>
      <div className={`max-w-[75%] group relative ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'} px-4 py-3`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        {!isUser && msg.sources && <SourceChips sources={msg.sources} />}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-text-dim" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChatWindow({ hasDocuments }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { answer, sources } = await sendMessage(text)
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full animate-fade-in-up stagger-2">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <FileSearch className="w-4 h-4 text-accent" />
        <span className="font-heading text-sm font-semibold text-text-muted uppercase tracking-wider">Chat</span>
        {messages.length > 0 && (
          <span className="text-xs text-text-dim ml-auto">{messages.length} messages</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-accent-dim/10 flex items-center justify-center mb-4 animate-float">
              <FileSearch className="w-8 h-8 text-accent/50" />
            </div>
            <p className="text-text-muted text-sm mb-1">
              {hasDocuments
                ? 'Ask anything about your documents'
                : 'Upload documents to get started'}
            </p>
            <p className="text-text-dim text-xs">
              Supports PDF, TXT, MD and CSV
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={hasDocuments ? 'Ask about your documents...' : 'Upload a document first...'}
            disabled={!hasDocuments || loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !hasDocuments}
            className="px-4 py-2.5 rounded-xl bg-accent-dim hover:bg-accent-dim/80 text-white font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
