"use client"

import { useState, useEffect, useRef } from "react"
import { mockConversations } from "@/lib/data"
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"

type Message = {
  id: string
  sender: string
  text: string
  time: string
  date?: string
}

const autoReplies = [
  "Gracias por la información. Revisaré los detalles.",
  "Entendido. ¿Podemos agendar una llamada para mañana?",
  "Perfecto, adjunto los documentos solicitados.",
  "¿Tiene alguna otra pregunta sobre el proceso?",
]

export default function LawyerMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages.map((m, i) => ({
        ...m,
        date: i === 0 ? "Ayer" : i < 3 ? "Ayer" : "Hoy"
      })))
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const filteredConversations = mockConversations.filter((conv) =>
    conv.lawyerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: String(messages.length + 1),
        sender: "me",
        text: newMessage,
        time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        date: "Hoy",
      }
      setMessages([...messages, newMsg])
      setNewMessage("")

      // Simulate client typing and auto-reply
      setIsTyping(true)
      const replyDelay = 2000 + Math.random() * 1000
      setTimeout(() => {
        setIsTyping(false)
        const autoReply: Message = {
          id: String(messages.length + 2),
          sender: "client",
          text: autoReplies[Math.floor(Math.random() * autoReplies.length)],
          time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
          date: "Hoy",
        }
        setMessages(prev => [...prev, autoReply])
      }, replyDelay)
    }
  }

  // Group messages by date
  const getDateSeparator = (currentDate: string | undefined, prevDate: string | undefined) => {
    if (currentDate !== prevDate) {
      return currentDate
    }
    return null
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
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5E8B8C] to-[#2D3C3C] flex items-center justify-center text-white font-bold text-xs">
                  {selectedConversation.lawyerName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div className="bg-[#F8F7F4] rounded-2xl px-4 py-2 flex gap-1">
                  <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                  <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                  <span className="w-2 h-2 bg-[#75524C] rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                </div>
              </div>
            )}
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
