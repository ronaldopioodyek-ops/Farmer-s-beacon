import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import AdminLogin from "./components/AdminLogin";
import AIQueryAssistant from "./components/AIQueryAssistant";
import AgroInputs from "./components/AgroInputs";
import Trainings from "./components/Trainings";
import QuestionsAnswers from "./components/QuestionsAnswers";
import Subscriptions from "./components/Subscriptions";
import Consultations from "./components/Consultations";
import AdminExport from "./components/AdminExport";
import WeatherWidget from "./components/WeatherWidget";
import logoImg from "./assets/images/logo_farmers_beacon_1783369351408.jpg";
import badgeImg from "./assets/images/badge_farmers_beacon_1783369365816.jpg";
import SuccessStories from "./components/SuccessStories";
import { 
  HelpCircle, 
  Award, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle,
  TrendingUp,
  UserCheck,
  ShieldAlert,
  Sprout,
  Download
} from "lucide-react";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"marketplace" | "qna" | "trainings" | "consultations">("marketplace");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Tick clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Parse query parameters for direct shared links (e.g. ?questionId=XYZ)
    const params = new URLSearchParams(window.location.search);
    const qId = params.get("questionId");
    if (qId) {
      setActiveQuestionId(qId);
      setActiveTab("qna");
    }
  }, []);

  const handleAdminStateChange = (adminStatus: boolean, currentUser: User | null) => {
    setIsAdmin(adminStatus);
    setUser(currentUser);
  };

  const handleClearActiveQuestion = () => {
    setActiveQuestionId(null);
    // Clean up URL query parameters
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  return (
    <div id="agro-app-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-200">
      
      {/* Top Header Navigation bar */}
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo and App name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-xs overflow-hidden border border-slate-100 dark:border-slate-700">
              <img src={logoImg} alt="The Farmer's Beacon Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-slate-900 dark:text-white tracking-tight">
                The Farmer's Beacon
              </h1>
              <p className="text-[10px] font-mono text-emerald-600 font-semibold mt-1 uppercase tracking-wider">
                Empowering Farmers, Building Community
              </p>
            </div>
          </div>

          {/* Right Header Panel (Auth + Local Time) */}
          <div className="flex items-center gap-4">
            
            {/* Real-time Clock display */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </span>
            </div>

            <AdminLogin onAdminStateChange={handleAdminStateChange} />
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Message / Banner */}
        <div className="mb-8 p-6 bg-linear-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-3xl border border-emerald-100/50 dark:border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              Welcome, Farmer & Client!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Interact with Ronald Opio, a certified agricultural consultant. Buy high-purity seed inputs, sign up for crop protection training workshops, or seek veterinary diagnostic consultations directly.
            </p>
          </div>

          {isAdmin && (
            <div className="px-3.5 py-1.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 shadow-md">
              <UserCheck className="w-3.5 h-3.5" />
              <span>EXPERT ADMINISTRATIVE DESK ACTIVE</span>
            </div>
          )}
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Center Panels: Main Interactive Views */}
          <div className="lg:col-span-2 space-y-8">
            
            <AdminExport isAdmin={isAdmin} />
            
            {/* View Switcher Tabs */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => {
                  setActiveTab("marketplace");
                  handleClearActiveQuestion();
                }}
                className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "marketplace"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>Input Market</span>
              </button>

              <button
                onClick={() => setActiveTab("qna")}
                className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "qna"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Q&A Hub</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("trainings");
                  handleClearActiveQuestion();
                }}
                className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "trainings"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Trainings & Skills</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("consultations");
                  handleClearActiveQuestion();
                }}
                className={`flex-1 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "consultations"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Private Consult</span>
              </button>
            </div>

            {/* Render selected module view */}
            <div className="min-h-[400px]">
              {activeTab === "marketplace" && (
                <AgroInputs isAdmin={isAdmin} />
              )}

              {activeTab === "qna" && (
                <QuestionsAnswers 
                  isAdmin={isAdmin} 
                  activeQuestionId={activeQuestionId} 
                  onClearActiveQuestion={handleClearActiveQuestion} 
                />
              )}

              {activeTab === "trainings" && (
                <Trainings isAdmin={isAdmin} />
              )}

              {activeTab === "consultations" && (
                <Consultations isAdmin={isAdmin} />
              )}
            </div>

            {/* Newsletter Subscription Row */}
            <Subscriptions isAdmin={isAdmin} />

          </div>

          {/* Right Panel: AI Expert + Quick Bulletins */}
          <div className="space-y-8">
            
            {/* Community Badge */}
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-slate-800 relative group">
                <img src={badgeImg} alt="Farmer's Beacon Community Badge" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
            </div>

            <WeatherWidget />
            
            {/* AI Agricultural Expert Agent */}
            <AIQueryAssistant />

            {/* Farmer Quick Resources / Tip of the day */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Seasonal Farm Tips</span>
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Rainy Season Preparation</h4>
                  <p className="leading-relaxed">Verify drainage channels around crop beds are clear. Dig silt pits on sloping land to prevent topsoil loss during thunderstorms.</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Poultry Ventilation</h4>
                  <p className="leading-relaxed">In high humidity, open upper wall nets on the chicken house to prevent buildup of toxic ammonia gas, protecting flock respiratory health.</p>
                </div>
              </div>
            </div>

            {/* Success Stories */}
            <SuccessStories />

          </div>

        </div>

      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="flex justify-center mb-4">
            <a 
              href="/api/export-source"
              download="farmers-beacon-source.zip"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm rounded-full shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Project Source Code
            </a>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} The Farmer's Beacon. Empowering Farmers, Building Community.
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Powered by secure cloud database architectures & server-side intelligent LLM diagnostics.
          </p>
        </div>
      </footer>

    </div>
  );
}
