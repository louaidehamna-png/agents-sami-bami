"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  agent: "sami" | "bami";
  name: string;
  emoji: string;
  gradient: string;
  placeholder: string;
}

export default function Chat({ agent, name, emoji, gradient, placeholder }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, agent }),
    });

    if (!res.body) { setLoading(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: assistantText },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center gap-3`}>
        <Link href="/" className="text-white/70 hover:text-white text-sm mr-2">← Retour</Link>
        <span className="text-3xl">{emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-white">{name}</h1>
          <p className="text-white/70 text-xs">Propulsé par Groq + Llama 3.3</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">{emoji}</div>
            <p className="text-lg">Bonjour ! Je suis {name}.</p>
            <p className="text-sm mt-1">{placeholder}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-100 rounded-bl-sm"
            }`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Écrivez à ${name}...`}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className={`px-5 py-3 rounded-xl font-medium text-white text-sm transition-opacity bg-gradient-to-r ${gradient} disabled:opacity-40`}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
