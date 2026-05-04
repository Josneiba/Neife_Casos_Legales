"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { useState, useEffect, useRef } from "react"
import {
  getConversations,
  getMessages,
  subscribeToMessages,
} from "@/lib/queries/messages"
import { sendMessage } from "@/lib/actions/messages"
import { createClient } from "@/lib/supabase/client"
import type { Message as DbMessage } from "@/lib/supabase/types"
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"

type Message = {
  id: string
  sender: "me" | "client"
  text: string
  time: string
  date?: string
}

/** Lista y cabecera usan `lawyerName` en el JSX; para el rol abogado mostramos el nombre del cliente. */
type Conversation = {
  id: string
  lawyerName: string
  lastMessage: string
  timestamp: string
  online: boolean
  unread: number
}

function mapLawyerConversation(row: Record<string, unknown>): Conversation {
  const client = row.client as { full_name?: string | null } | null | undefined
  return {
    id: String(row.id),
    lawyerName: client?.full_name ?? "—",
    lastMessage: String(row.last_message ?? ""),
    timestamp: row.last_message_at
      ? new Date(row.last_message_at as string).toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    online: false,
    unread: 0,
  }
}

function mapDbMessage(m: DbMessage): Message {
  const d = m.created_at ? new Date(m.created_at) : new Date()
  return {
    id: m.id,
    sender: m.sender_role === "lawyer" ? "me" : "client",
    text: m.text,
    time: d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    date: d.toLocaleDateString("es-CL"),
  }
}

export default function LawyerMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      getConversations(user.id, "lawyer").then((data) => {
        const mapped = (data ?? []).map((row) =>
          mapLawyerConversation(row as Record<string, unknown>)
        )
        setConversations(mapped)
        if (mapped.length > 0) setSelectedConversation(mapped[0])
        setLoading(false)
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedConversation) return

    channelRef.current?.unsubscribe()

    getMessages(selectedConversation.id).then((rows) => {
      setMessages((rows as DbMessage[]).map((m) => mapDbMessage(m)))
    })

    channelRef.current = subscribeToMessages(
      selectedConversation.id,
      (newMessageRow) => {
        const mapped = mapDbMessage(newMessageRow as DbMessage)
        setMessages((prev) =>
          prev.some((p) => p.id === mapped.id) ? prev : [...prev, mapped]
        )
      }
    )

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const filteredConversations = conversations.filter((conv) =>
    conv.lawyerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId) return

    const text = newMessage
    setNewMessage("")

    await sendMessage({
      conversation_id: selectedConversation.id,
      text,
      sender_role: "lawyer",
    })
  }

  // Group messages by date
  const getDateSeparator = (currentDate: string | undefined, prevDate: string | undefined) => {
    if (currentDate !== prevDate) {
      return currentDate
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-2rem)] flex bg-white rounded-xl overflow-hidden border border-[#D5C3B6]/30 animate-pulse">
        <div className="w-80 border-r border-[#D5C3B6]/30 bg-[#F8F7F4]/80" />
        <div className="flex-1 bg-[#F8F7F4]/50" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex bg-white rounded-xl overflow-hidden border border-[#D5C3B6]/30">
      {/* Conversations List */}
      <div className="w-80 border-r border-[#D5C3B6]/30 flex flex-col">
        <div className="p-4 border-b border-[#D5C3B6]/30">
          <h2 className="text-lg font-semibold text-[#2D3C3C] mb-3">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#75524C]" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7F4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75524C] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#75524C]">
              Sin conversaciones
            </div>
          ) : null}
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-[#F8F7F4] transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${
                selectedConversation?.id === conversation.id ? "bg-[#75524C]/10 border-l-2 border-l-[#75524C]" : ""
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-semibold">
                  {conversation.lawyerName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                {conversation.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#2D3C3C] truncate">
                    {conversation.lawyerName}
                  </span>
                  <span className="text-xs text-[#75524C]">{conversation.timestamp}</span>
                </div>
                <p className="text-sm text-[#75524C] truncate">{conversation.lastMessage}</p>
                {conversation.unread > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-[#75524C] text-white text-xs rounded-full mt-1">
                    {conversation.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#D5C3B6]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-semibold">
                {selectedConversation.lawyerName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="font-medium text-[#2D3C3C]">
                  {selectedConversation.lawyerName}
                </h3>
                <p className="text-sm text-[#75524C]">
                  {selectedConversation.online ? "En línea" : "Desconectado"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-[#75524C]" />
              </button>
              <button className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors">
                <Video className="w-5 h-5 text-[#75524C]" />
              </button>
              <button className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-[#75524C]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              const dateSeparator = getDateSeparator(message.date, messages[index - 1]?.date)
              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {dateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#D5C3B6]/50" />
                      <span className="text-xs text-[#D5C3B6] bg-[#F8F7F4] px-2">{dateSeparator}</span>
                      <div className="flex-1 h-px bg-[#D5C3B6]/50" />
                    </div>
                  )}
                  <div
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender === "me"
                          ? "bg-[#75524C] text-white rounded-br-md"
                          : "bg-[#F8F7F4] text-[#2D3C3C] rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className={`text-xs mt-1 block ${
                        message.sender === "me" ? "text-white/70" : "text-[#75524C]"
                      }`}>
                        {message.time}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-[#D5C3B6]/30">
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-[#F8F7F4] rounded-lg transition-colors">
                <Paperclip className="w-5 h-5 text-[#75524C]" />
              </button>
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 px-4 py-2 bg-[#F8F7F4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75524C] focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-[#75524C] text-white rounded-lg hover:bg-[#75524C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#75524C]">
          Selecciona una conversación para comenzar
        </div>
      )}
    </div>
  )
}
