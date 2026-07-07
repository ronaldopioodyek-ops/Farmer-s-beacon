import React, { useState } from "react";
import { Sparkles, Send, RefreshCw, MessageSquare, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function AIQueryAssistant() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Crops");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your AI Agricultural Assistant. Ask me anything about crop diseases, organic fertilizers, veterinary care for livestock, or general farm management, and I will give you instant guidance!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userQuery = query;
    setQuery("");
    setError(null);
    setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userQuery } as Message];
    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          category: category,
          // Send last 4 messages as history context
          history: updatedMessages.slice(-5, -1)
        })
      });

      const data = await response.json();
      if (response.ok && data.response) {
        setMessages((prev) => [...prev, { role: "model", text: data.response }]);
      } else {
        throw new Error(data.error || "Failed to generate a consultation advice.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "⚠️ Sorry, I encountered an error. Please verify the server API configuration or try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "model",
        text: "Hello! I am your AI Agricultural Assistant. Ask me anything about crop diseases, organic fertilizers, veterinary care for livestock, or general farm management, and I will give you instant guidance!"
      }
    ]);
    setError(null);
  };

  return (
    <div id="ai-query-assistant" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-100 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base leading-tight">Instant AI Consultation</h3>
            <p className="text-xs text-emerald-100/80">Crops, Animals, and Management expert advice</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          title="Clear Chat History"
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-emerald-100 hover:text-white" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-2xs leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-slate-900 text-white dark:bg-slate-800 rounded-br-none"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
              <span className="text-xs text-slate-400 font-medium ml-1">Consulting agricultural models...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleConsult} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex gap-2 mb-2">
          {["Crops", "Animals", "Farm Management"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                category === cat
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask a question about ${category.toLowerCase()}...`}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white disabled:opacity-75"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
