"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Drug {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string;
  sideEffects: string[];
}

export default function MedicationsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/drugs")
      .then((r) => r.json())
      .then((data) => {
        setDrugs(data);
        setLoading(false);
      });
  }, []);

  const remove = async (id: string) => {
    await fetch("/api/drugs", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setDrugs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#202124] mb-1">Medications</h1>
        <p className="text-[#5f6368] text-sm">
          Text &ldquo;I&apos;m taking [drug] [dosage]&rdquo; to add a medication. Side effects are pulled from the FDA database.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && drugs.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#5f6368] text-base">No medications added yet.</p>
          <p className="text-[#5f6368] text-sm mt-1">
            Send &ldquo;I started taking ibuprofen 400mg&rdquo; to add one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {drugs.map((d) => {
          const isExpanded = expanded === d.id;
          return (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="px-5 py-4 flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0 mt-0.5"
                >
                  <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#202124] font-medium capitalize">{d.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {d.dosage && (
                      <span className="text-sm text-[#5f6368]">{d.dosage}</span>
                    )}
                    {d.frequency && (
                      <span className="text-sm text-[#5f6368]">{d.frequency}</span>
                    )}
                    <span className="text-xs text-[#9aa0a6]">
                      Since {format(new Date(d.startDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  {d.sideEffects?.length > 0 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : d.id)}
                      className="mt-2 text-xs text-[#1a73e8] hover:underline flex items-center gap-1"
                    >
                      {d.sideEffects.length} known side effects
                      <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => remove(d.id)}
                  className="text-[#9aa0a6] hover:text-[#5f6368] p-1 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isExpanded && d.sideEffects?.length > 0 && (
                <div className="px-5 pb-4 border-t border-[#f1f3f4]">
                  <p className="text-xs font-medium text-[#5f6368] uppercase tracking-wide mt-3 mb-2">
                    FDA Reported Side Effects
                  </p>
                  <ul className="space-y-1.5">
                    {d.sideEffects.map((effect, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#5f6368]">
                        <span className="w-1 h-1 rounded-full bg-[#9aa0a6] mt-2 shrink-0" />
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
