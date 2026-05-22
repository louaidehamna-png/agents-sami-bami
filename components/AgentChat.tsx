"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Step {
  type: string;
  label: string;
  result?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
}

interface AgentChatProps {
  apiPath: string;
  name: string;
  emoji: string;
  gradient: string;
  placeholder: string;
}

export default function AgentChat({ apiPath, name, emoji, gradient, placeholder }: AgentChatProps) {
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
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await res.json();
    setMessages([...history, { role: "assistant", content: data.response, steps: data.steps }]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center gap-3`}>
        <Link href="/" className="text-white/70 hover:text-white text-sm mr-2">← Retour</Link>
        <span className="text-3xl">{emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-white">{name}</h1>
          <p className="text-white/70 text-xs">Agent autonome — il agit directement sur le code</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">{emoji}</div>
            <p className="text-lg text-white">Bonjour ! Je suis {name}.</p>
            <p className="text-sm mt-1">{placeholder}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.role === "assistant" && msg.steps && msg.steps.length > 0 && (
              <div className="mb-2 space-y-1 w-full max-w-[80%]">
                {msg.steps.map((step, j) => (
                  <div key={j} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400">
                    <span className="font-medium text-gray-300">{step.label}</span>
                    {step.result && step.result.startsWith("✅") && (
                      <span className="ml-2 text-green-400">{step.result.split("\n")[0]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-100 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <span className="animate-spin">⚙️</span> {name} est en train d'agir sur le code...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Dites à ${name} quoi faire...`}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className={`px-5 py-3 rounded-xl font-medium text-white text-sm bg-gradient-to-r ${gradient} disabled:opacity-40`}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
