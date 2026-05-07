"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Symptom {
  id: string;
  description: string;
  severity: number | null;
  notes: string | null;
  createdAt: string;
}

const severityColor = (s: number | null) => {
  if (!s) return "bg-[#f1f3f4] text-[#5f6368]";
  if (s <= 3) return "bg-[#e6f4ea] text-[#137333]";
  if (s <= 6) return "bg-[#fef7e0] text-[#b06000]";
  return "bg-[#fce8e6] text-[#c5221f]";
};

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/symptoms")
      .then((r) => r.json())
      .then((data) => {
        setSymptoms(data);
        setLoading(false);
      });
  }, []);

  const dismiss = async (id: string) => {
    await fetch("/api/symptoms", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  };

  const grouped = symptoms.reduce<Record<string, Symptom[]>>((acc, s) => {
    const day = format(new Date(s.createdAt), "MMMM d, yyyy");
    (acc[day] = acc[day] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#202124] mb-1">Symptoms</h1>
        <p className="text-[#5f6368] text-sm">
          Text your symptoms to{" "}
          <span className="font-medium text-[#1a73e8]">
            {process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "your Twilio number"}
          </span>
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && symptoms.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#5f6368] text-base">No symptoms logged yet.</p>
          <p className="text-[#5f6368] text-sm mt-1">Send an SMS to get started.</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <p className="text-xs font-medium text-[#5f6368] uppercase tracking-wide mb-3">
              {day}
            </p>
            <div className="space-y-2">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-[#e0e0e0] px-5 py-4 flex items-start gap-4 group hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[#202124] font-medium capitalize">{s.description}</p>
                    {s.notes && (
                      <p className="text-[#5f6368] text-sm mt-0.5">{s.notes}</p>
                    )}
                    <p className="text-[#9aa0a6] text-xs mt-1">
                      {format(new Date(s.createdAt), "h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.severity && (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${severityColor(s.severity)}`}
                      >
                        {s.severity}/10
                      </span>
                    )}
                    <button
                      onClick={() => dismiss(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#9aa0a6] hover:text-[#5f6368] transition-opacity p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
