import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Mail, Loader2, CheckCircle, AlertCircle, Copy, Check, Users } from "lucide-react";

interface SubscriptionsProps {
  isAdmin: boolean;
}

export default function Subscriptions({ isAdmin }: SubscriptionsProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin view states
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSubscribers();
    }
  }, [isAdmin]);

  const fetchSubscribers = async () => {
    setLoadingSubs(true);
    try {
      const snapshot = await getDocs(collection(db, "subscriptions"));
      const loaded: any[] = [];
      snapshot.forEach((doc) => {
        loaded.push({ id: doc.id, ...doc.data() });
      });
      setSubscribers(loaded);
    } catch (err) {
      console.error("Error loading subscribers:", err);
      handleFirestoreError(err, OperationType.LIST, "subscriptions");
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if email already exists
      const q = query(collection(db, "subscriptions"), where("email", "==", email.trim().toLowerCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        throw new Error("This email is already subscribed!");
      }

      try {
        await addDoc(collection(db, "subscriptions"), {
          email: email.trim().toLowerCase(),
          subscribedAt: Date.now(),
          isActive: true
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "subscriptions");
        throw err;
      }

      setSuccess(true);
      setEmail("");
      if (isAdmin) {
        fetchSubscribers();
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      setError(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyEmails = () => {
    if (subscribers.length === 0) return;
    const emailList = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emailList).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div id="subscriptions-container" className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Subscribe Promo */}
        <div className="space-y-4">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl w-fit">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-slate-950 dark:text-white">
              Subscribe for Agricultural Bulletins
            </h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Receive seasonal crop calendars, animal vaccination alerts, pest outbreaks notifications, and details of upcoming training programs directly to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-3">
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span>You have successfully subscribed to the agricultural bulletin!</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-850 text-white font-medium rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Subscribe Now</span>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">Zero spam. Unsubscribe at any time.</p>
          </form>
        </div>

        {/* Right Side: Admin view of Subscribers list OR Promo visual */}
        <div>
          {isAdmin ? (
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-850">
                <h4 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Subscribers Directory ({subscribers.length})</span>
                </h4>
                {subscribers.length > 0 && (
                  <button
                    onClick={copyEmails}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Emails Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All Emails</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {loadingSubs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No subscribers found yet.</p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-2">
                  {subscribers.map((sub) => (
                    <div 
                      key={sub.id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{sub.email}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-600 text-white rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-x-8 translate-y-8" />
              <h4 className="font-display font-semibold text-sm">Empowering Local Agriculture</h4>
              <p className="text-emerald-100 text-xs leading-relaxed">
                "Connecting smallholder farmers with certified inputs, instant veterinary-level intelligence, and structured training has been shown to increase crop yields by over 40% in East African communities."
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">— Ronald Opio, Consultant</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
