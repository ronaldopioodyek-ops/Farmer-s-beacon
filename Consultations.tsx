import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Consultation } from "../types";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Clock,
  Compass,
  FileText,
  User,
  ExternalLink
} from "lucide-react";

interface ConsultationsProps {
  isAdmin: boolean;
}

export default function Consultations({ isAdmin }: ConsultationsProps) {
  const [activeTab, setActiveTab] = useState<"request" | "track">("request");

  // Request Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Consultation["category"]>("Crops");
  const [queryText, setQueryText] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Tracking States
  const [trackId, setTrackId] = useState("");
  const [trackedConsult, setTrackedConsult] = useState<Consultation | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Admin View States
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [adminFilter, setAdminFilter] = useState<string>("All");

  useEffect(() => {
    if (isAdmin) {
      fetchAllConsultations();
    }
  }, [isAdmin]);

  const fetchAllConsultations = async () => {
    setLoadingAll(true);
    try {
      const q = query(collection(db, "consultations"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const loaded: Consultation[] = [];
      snapshot.forEach((doc) => {
        loaded.push({ id: doc.id, ...doc.data() } as Consultation);
      });
      setAllConsultations(loaded);
    } catch (err) {
      console.error("Error fetching consultations:", err);
      handleFirestoreError(err, OperationType.LIST, "consultations");
    } finally {
      setLoadingAll(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !queryText.trim() || submittingReq) return;
    setSubmittingReq(true);
    setCreatedId(null);

    try {
      const newConsult: Omit<Consultation, "id"> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        query: queryText.trim(),
        status: "Pending",
        createdAt: Date.now()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "consultations"), newConsult);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "consultations");
        throw err;
      }
      setCreatedId(docRef.id);
      
      // Reset request fields
      setName("");
      setEmail("");
      setQueryText("");
      setCategory("Crops");
    } catch (err) {
      console.error("Request error:", err);
      alert("Failed to submit request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleTrackConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    setTrackingLoading(true);
    setTrackError(null);
    setTrackedConsult(null);

    try {
      const docRef = doc(db, "consultations", trackId.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTrackedConsult({ id: docSnap.id, ...docSnap.data() } as Consultation);
      } else {
        setTrackError("No consultation request found with this ID. Please double check the ID.");
      }
    } catch (err: any) {
      console.error("Error tracking:", err);
      handleFirestoreError(err, OperationType.GET, `consultations/${trackId.trim()}`);
      setTrackError("Failed to track consultation. Ensure the ID format is correct.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleReplySubmit = async (cId: string) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);

    try {
      await updateDoc(doc(db, "consultations", cId), {
        responseText: replyText.trim(),
        status: "Resolved",
        repliedAt: Date.now()
      });

      setAllConsultations((prev) =>
        prev.map((c) =>
          c.id === cId
            ? {
                ...c,
                responseText: replyText.trim(),
                status: "Resolved" as const,
                repliedAt: Date.now()
              }
            : c
        )
      );

      // If they are tracking this item, update it locally too
      if (trackedConsult && trackedConsult.id === cId) {
        setTrackedConsult((prev) =>
          prev
            ? {
                ...prev,
                responseText: replyText.trim(),
                status: "Resolved" as const,
                repliedAt: Date.now()
              }
            : null
        );
      }

      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      console.error("Reply error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `consultations/${cId}`);
      alert("Failed to publish consultation reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const filteredConsultations = allConsultations.filter((c) => {
    if (adminFilter === "All") return true;
    if (adminFilter === "Pending") return c.status === "Pending";
    if (adminFilter === "Resolved") return c.status === "Resolved";
    return true;
  });

  return (
    <div id="consultations-section" className="space-y-6">
      
      {/* Admin View of Consultations */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5.5 h-5.5 text-emerald-600" />
                <span>Expert Consultations Desk</span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Review and resolve private agricultural, veterinary, and soil consulting requests from local farmers.
              </p>
            </div>

            <div className="flex gap-2">
              {["All", "Pending", "Resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => setAdminFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    adminFilter === status
                      ? "bg-slate-900 text-white dark:bg-slate-800"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loadingAll ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Loading consultations dashboard...</span>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 text-center py-12 rounded-2xl">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No consultations in this category</h4>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultations.map((c) => (
                <div 
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-200 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">
                          {c.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          c.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-display font-medium text-sm text-slate-800 dark:text-white mt-2 leading-relaxed">
                        "{c.query}"
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Submitted by <strong className="text-slate-600 dark:text-slate-300">{c.name}</strong> ({c.email}) on {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 selection:bg-emerald-100">
                        ID Code: <strong className="text-slate-700 dark:text-slate-300">{c.id}</strong>
                      </p>
                    </div>
                  </div>

                  {c.status === "Resolved" ? (
                    <div className="bg-emerald-50/20 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-50 border-l-2 border-l-emerald-500">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {c.responseText}
                      </p>
                    </div>
                  ) : (
                    replyingId !== c.id && (
                      <button
                        onClick={() => {
                          setReplyingId(c.id);
                          setReplyText("");
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl"
                      >
                        Write Advice Response
                      </button>
                    )
                  )}

                  {replyingId === c.id && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Formulate Expert Response</h5>
                      <textarea
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Provide deep, actionable farm recommendations..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(c.id)}
                          disabled={replySubmitting || !replyText.trim()}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg"
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => setReplyingId(null)}
                          className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Farmer view of Private Consultation Hub */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
                Private Consultation Hub
              </h3>
              <p className="text-xs text-slate-500">
                Submit private consultations to Ronald Opio and track responses using a unique tracking code.
              </p>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setActiveTab("request")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "request"
                    ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
              >
                Request Consultation
              </button>
              <button
                onClick={() => setActiveTab("track")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "track"
                    ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
              >
                Track response
              </button>
            </div>
          </div>

          {activeTab === "request" ? (
            <div>
              {createdId ? (
                <div className="border border-emerald-100 bg-emerald-50/50 p-6 rounded-2xl space-y-4 max-w-lg mx-auto text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="font-display font-semibold text-slate-800">Consultation Request Received!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your request has been successfully queued. Keep your private tracking ID below to check back for your expert response:
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 font-mono text-sm select-all flex items-center justify-between">
                    <span className="font-bold text-slate-900">{createdId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdId);
                        alert("Tracking Code copied to clipboard!");
                      }}
                      className="text-xs text-emerald-700 font-bold hover:underline"
                    >
                      Copy Code
                    </button>
                  </div>

                  <button
                    onClick={() => setCreatedId(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. David Okello"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. david@gmail.com"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Consultation Topic *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Consultation["category"])}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="Crops">Crop Diagnostics & Soils</option>
                        <option value="Animals">Animal Care & Veterinary</option>
                        <option value="Farm Management">Farm Business & Finance</option>
                        <option value="Other">Other Category</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your Private Inquiry *</label>
                      <textarea
                        required
                        rows={4}
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        placeholder="List specific animal symptoms, plant discoloration patterns, or management problems. This text is private and visible only to you and the consultant."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReq}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {submittingReq ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Private Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Track consultations */
            <div className="space-y-6">
              <form onSubmit={handleTrackConsultation} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  required
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Paste your 20-character consultation ID..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                </button>
              </form>

              {trackError && (
                <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-xl text-xs border border-amber-100 max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{trackError}</span>
                </div>
              )}

              {trackedConsult && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 max-w-2xl animate-fade-in">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded-md">
                        {trackedConsult.category} Topic
                      </span>
                      <h4 className="font-display font-medium text-slate-800 text-sm mt-1">
                        "{trackedConsult.query}"
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                      trackedConsult.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {trackedConsult.status}
                    </span>
                  </div>

                  {trackedConsult.status === "Resolved" && trackedConsult.responseText ? (
                    <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Expert Response:</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium pt-1.5">
                        {trackedConsult.responseText}
                      </p>
                      <p className="text-[9px] text-slate-400 text-right pt-2 font-medium italic">
                        Resolved by Ronald Opio on {trackedConsult.repliedAt ? new Date(trackedConsult.repliedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-100">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>This consultation is currently being reviewed by Ronald Opio. Check back shortly.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
