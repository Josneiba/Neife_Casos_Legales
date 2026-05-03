"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Paperclip, Smile, Send, Circle } from "lucide-react"
import { mockConversations } from "@/lib/data"

type Message = {
  id: string
  sender: "client" | "lawyer"
  text: string
  time: string
  date?: string
}

type Conversation = typeof mockConversations[0]

const autoReplies = [
  "Gracias por su mensaje. Revisaré los documentos y le responderé pronto.",
  "Entendido. Programaré una reunión para discutir los detalles.",
  "Perfecto, procederé con la gestión. ¿Tiene alguna otra consulta?",
  "He recibido su información. Le mantendré informado del progreso.",
]

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0])
        setMessages(
          mockConversations[0].messages.map((m, i) => ({
            ...m,
            sender: m.sender as Message["sender"],
            date: i === 0 ? "Ayer" : i < 3 ? "Ayer" : "Hoy",
          }))
        )
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setMessages(
      conv.messages.map((m, i) => ({
        ...m,
        sender: m.sender as Message["sender"],
        date: i === 0 ? "Ayer" : i < 3 ? "Ayer" : "Hoy",
      }))
    )
    setIsTyping(false)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const newMsg: Message = {
      id: String(messages.length + 1),
      sender: "client",
      text: newMessage,
      time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      date: "Hoy",
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate lawyer typing and auto-reply
    setIsTyping(true)
    const replyDelay = 2000 + Math.random() * 1000
    setTimeout(() => {
      setIsTyping(false)
      const autoReply: Message = {
        id: String(messages.length + 2),
        sender: "lawyer",
        text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        date: "Hoy",
      }
      setMessages(prev => [...prev, autoReply])
    }, replyDelay)
  }

  const filteredConversations = mockConversations.filter((conv) =>
    conv.lawyerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group messages by date
  const getDateSeparator = (currentDate: string | undefined, prevDate: string | undefined) => {
    if (currentDate !== prevDate) {
      return currentDate
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <div className="w-1/3 animate-pulse">
          <div className="h-12 bg-[#D5C3B6]/30 rounded mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#D5C3B6]/30 rounded mb-2"></div>
          ))}
        </div>
        <div className="flex-1 bg-white border border-[#D5C3B6]/30 rounded-lg animate-pulse">
          <div className="h-16 bg-[#D5C3B6]/30 rounded-t"></div>
          <div className="flex-1 p-4">
            <div className="h-40 bg-[#D5C3B6]/30 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Conversations list */}
      <div className="lg:w-1/3 flex flex-col bg-white border border-[#D5C3B6]/30 rounded-lg overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-[#D5C3B6]/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75524C]" size={18} />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[#75524C]">
              Sin conversaciones activas
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left p-4 border-b border-[#D5C3B6]/30 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  selectedConversation?.id === conv.id
                    ? "bg-[#5E8B8C]/10 border-l-2 border-l-[#5E8B8C]"
                    : "hover:bg-[#F8F7F4]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                      {conv.lawyerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#2D3C3C] text-sm truncate">
                        {conv.lawyerName}
                      </h3>
                      <span className="text-xs text-[#75524C]">{conv.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#75524C]">{conv.lawyerSpecialty}</p>
                    <p className="text-sm text-[#75524C] truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-[#C27F79] rounded-full text-xs flex items-center justify-center text-white">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white border border-[#D5C3B6]/30 rounded-lg overflow-hidden">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-[#75524C]">
            Selecciona una conversación
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-[#D5C3B6]/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold">
                    {selectedConversation.lawyerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  {selectedConversation.online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#2D3C3C]">{selectedConversation.lawyerName}</h3>
                  <div className="flex items-center gap-1 text-xs">
                    <Circle 
                      size={8} 
                      className={selectedConversation.online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"} 
                    />
                    <span className="text-[#75524C]">
                      {selectedConversation.online ? "En línea" : "Desconectado"}
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-sm text-[#5E8B8C] hover:underline">
                Ver Perfil
              </button>
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
                      className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 ${
                          message.sender === "client"
                            ? "bg-[#5E8B8C] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
                            : "bg-[#D5C3B6]/30 text-[#2D3C3C] rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === "client" ? "text-white/70" : "text-[#75524C]"
                        }`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-xs">
                    {selectedConversation.lawyerName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="bg-[#D5C3B6]/30 rounded-2xl px-4 py-2 flex gap-1">
                    <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                    <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                    <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#D5C3B6]/30">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 text-[#75524C] hover:text-[#5E8B8C] transition-colors">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="p-2 text-[#75524C] hover:text-[#5E8B8C] transition-colors">
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-[#D5C3B6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E8B8C] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-[#5E8B8C] text-white rounded-lg hover:bg-[#5E8B8C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
