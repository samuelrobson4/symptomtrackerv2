"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Dose {
  id: string;
  dosage: string | null;
  rawMessage: string | null;
  takenAt: string;
}

interface Drug {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  startDate: string;
  sideEffects: string[];
  rawMessage: string | null;
  doses: Dose[];
}

type Tab = "effects" | "doses" | "original";

export default function MedicationsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<Record<string, Tab>>({});

  useEffect(() => {
    fetch("/api/drugs")
      .then((r) => r.json())
      .then((data) => { setDrugs(data); setLoading(false); });
  }, []);

  const remove = async (id: string) => {
    await fetch("/api/drugs", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    setDrugs((prev) => prev.filter((d) => d.id !== id));
  };

  const getTab = (id: string): Tab => tab[id] ?? "effects";
  const setDrugTab = (id: string, t: Tab) => setTab((prev) => ({ ...prev, [id]: t }));

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#202124] mb-1">Medications</h1>
        <p className="text-[#5f6368] text-sm">
          Text &ldquo;I started [drug] [dosage]&rdquo; to add, or &ldquo;took my [drug]&rdquo; to log a dose.
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
          <p className="text-[#5f6368] text-sm mt-1">Send &ldquo;I started taking ibuprofen 400mg&rdquo; to add one.</p>
        </div>
      )}

      <div className="space-y-3">
        {drugs.map((d) => {
          const isExpanded = expanded === d.id;
          const currentTab = getTab(d.id);

          return (
            <div key={d.id} className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden hover:shadow-sm transition-shadow">
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#202124] font-medium capitalize">{d.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {d.dosage && <span className="text-sm text-[#5f6368]">{d.dosage}</span>}
                    {d.frequency && <span className="text-sm text-[#5f6368]">{d.frequency}</span>}
                    <span className="text-xs text-[#9aa0a6]">Started {format(new Date(d.startDate), "MMM d, yyyy")}</span>
                    {d.doses.length > 0 && (
                      <span className="text-xs text-[#9aa0a6]">{d.doses.length} dose{d.doses.length !== 1 ? "s" : ""} logged</span>
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : d.id)}
                    className="mt-2 text-xs text-[#1a73e8] hover:underline flex items-center gap-1"
                  >
                    Details
                    <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <button onClick={() => remove(d.id)} className="text-[#9aa0a6] hover:text-[#5f6368] p-1 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-[#f1f3f4]">
                  <div className="flex border-b border-[#f1f3f4]">
                    {(["effects", "doses", "original"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDrugTab(d.id, t)}
                        className={`px-5 py-2.5 text-xs font-medium capitalize transition-colors ${
                          currentTab === t
                            ? "text-[#1a73e8] border-b-2 border-[#1a73e8]"
                            : "text-[#5f6368] hover:text-[#202124]"
                        }`}
                      >
                        {t === "effects" ? "Side Effects" : t === "doses" ? `Doses (${d.doses.length})` : "Original"}
                      </button>
                    ))}
                  </div>

                  <div className="px-5 py-4">
                    {currentTab === "effects" && (
                      d.sideEffects?.length > 0 ? (
                        <ul className="space-y-1.5">
                          {d.sideEffects.map((e, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#5f6368]">
                              <span className="w-1 h-1 rounded-full bg-[#9aa0a6] mt-2 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#9aa0a6]">No FDA side effects found for this drug.</p>
                      )
                    )}

                    {currentTab === "doses" && (
                      d.doses.length > 0 ? (
                        <ul className="space-y-2">
                          {d.doses.map((dose) => (
                            <li key={dose.id} className="flex items-start justify-between text-sm">
                              <div>
                                <span className="text-[#202124]">{format(new Date(dose.takenAt), "MMM d, yyyy · h:mm a")}</span>
                                {dose.dosage && <span className="text-[#5f6368] ml-2">{dose.dosage}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#9aa0a6]">No doses logged yet.</p>
                      )
                    )}

                    {currentTab === "original" && (
                      d.rawMessage ? (
                        <p className="text-sm text-[#5f6368] italic leading-relaxed">&ldquo;{d.rawMessage}&rdquo;</p>
                      ) : (
                        <p className="text-sm text-[#9aa0a6]">No original message stored.</p>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
