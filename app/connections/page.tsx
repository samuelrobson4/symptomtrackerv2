"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Connection {
  id: string;
  title: string;
  description: string;
  confidence: string;
  symptomIds: string[];
  drugIds: string[];
  createdAt: string;
}

const confidenceBadge = (c: string) => {
  if (c === "high") return "bg-[#fce8e6] text-[#c5221f]";
  if (c === "medium") return "bg-[#fef7e0] text-[#b06000]";
  return "bg-[#f1f3f4] text-[#5f6368]";
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((data) => {
        setConnections(data);
        setLoading(false);
      });
  }, []);

  const dismiss = async (id: string) => {
    await fetch("/api/connections", {
      method: "PATCH",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#202124] mb-1">AI Connections</h1>
        <p className="text-[#5f6368] text-sm">
          Potential patterns the AI has noticed. These are suggestions, not medical advice.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && connections.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#5f6368] text-base">No connections found yet.</p>
          <p className="text-[#5f6368] text-sm mt-1">
            The AI will flag patterns here as you log more symptoms.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {connections.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-[#e0e0e0] px-5 py-5 group hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${confidenceBadge(c.confidence)}`}
                  >
                    {c.confidence} confidence
                  </span>
                  <span className="text-xs text-[#9aa0a6]">
                    {format(new Date(c.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-[#202124] font-medium mb-1">{c.title}</p>
                <p className="text-[#5f6368] text-sm leading-relaxed">{c.description}</p>
              </div>
              <button
                onClick={() => dismiss(c.id)}
                className="text-[#9aa0a6] hover:text-[#5f6368] p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && connections.length > 0 && (
        <p className="text-xs text-[#9aa0a6] text-center mt-8">
          Always consult a healthcare professional before making medical decisions.
        </p>
      )}
    </div>
  );
}
