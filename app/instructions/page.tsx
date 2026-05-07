"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Instruction {
  id: string;
  content: string;
  createdAt: string;
}

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instructions")
      .then((r) => r.json())
      .then((data) => { setInstructions(data); setLoading(false); });
  }, []);

  const remove = async (id: string) => {
    await fetch("/api/instructions", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setInstructions((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#202124] mb-1">AI Memory</h1>
        <p className="text-[#5f6368] text-sm">
          Rules the AI has learned from you. Text &ldquo;remember to...&rdquo; or &ldquo;always...&rdquo; to add one.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && instructions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#5f6368] text-base">No instructions stored yet.</p>
          <p className="text-[#5f6368] text-sm mt-1">
            Try texting &ldquo;remember to always list symptoms separately&rdquo;.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {instructions.map((inst, i) => (
          <div
            key={inst.id}
            className="bg-white rounded-xl border border-[#e0e0e0] px-5 py-4 flex items-start gap-4 group hover:shadow-sm transition-shadow"
          >
            <span className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[#202124] text-sm leading-relaxed">{inst.content}</p>
              <p className="text-[#9aa0a6] text-xs mt-1">
                Added {format(new Date(inst.createdAt), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
            <button
              onClick={() => remove(inst.id)}
              className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-[#5f6368] transition-opacity p-1 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {!loading && instructions.length > 0 && (
        <p className="text-xs text-[#9aa0a6] text-center mt-8">
          These rules are injected into every SMS parse. Delete any that no longer apply.
        </p>
      )}
    </div>
  );
}
