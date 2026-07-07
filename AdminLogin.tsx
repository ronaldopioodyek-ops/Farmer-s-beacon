import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { Lock, LogOut, Mail, UserCheck, Shield, AlertCircle } from "lucide-react";

interface AdminLoginProps {
  onAdminStateChange: (isAdmin: boolean, user: User | null) => void;
}

export default function AdminLogin({ onAdminStateChange }: AdminLoginProps) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const ADMIN_EMAIL = "ronaldopioodyek@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const isAdmin = currentUser?.email === ADMIN_EMAIL;
      onAdminStateChange(isAdmin, currentUser);
    });
    return unsubscribe;
  }, [onAdminStateChange]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const isUserAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div id="admin-auth-panel" className="relative">
      {user ? (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 px-4 py-2 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-slate-400">Logged in as</span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              {isUserAdmin && <Shield className="w-3.5 h-3.5 text-emerald-600" />}
              {user.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Expert Sign In</span>
          </button>

          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span>Agricultural Expert Sign In</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Access your dashboard to manage listings, consultations & Q&As
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleAuth} className="p-6 space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                    {email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        ✨ Accessing primary agricultural expert administrative profile.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-xs text-emerald-600 hover:underline font-medium"
                    >
                      {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
