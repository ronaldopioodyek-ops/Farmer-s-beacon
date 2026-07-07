import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Question } from "../types";
import { 
  HelpCircle, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Check, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Filter,
  ArrowLeft,
  Search
} from "lucide-react";

interface QuestionsAnswersProps {
  isAdmin: boolean;
  activeQuestionId: string | null;
  onClearActiveQuestion: () => void;
}

const INITIAL_QUESTIONS: Omit<Question, "id">[] = [
  {
    questionText: "My tomato plants are developing black/dark brown concentric rings on lower leaves, and some of the lower leaves are turning yellow and dropping. What could this be and how do I cure it?",
    askerName: "Peter Ayella",
    askerEmail: "peter.ayella@example.com",
    answerText: "This sounds like Early Blight (Alternaria solani), a very common fungal disease. To manage it:\n1. Prune and destroy infected lower leaves immediately to stop spores from splashing.\n2. Avoid overhead watering; apply water directly to the soil/roots.\n3. Practice crop rotation (avoid planting tomatoes, potatoes, or peppers in the same spot for 3 years).\n4. Apply certified copper-based organic fungicides early in the morning.",
    answeredBy: "Ronald Opio - Agricultural Consultant",
    dateAsked: Date.now() - 1000000,
    dateAnswered: Date.now() - 900000,
    isAnswered: true,
    category: "Crops",
    upvotes: 18
  },
  {
    questionText: "How can I construct an effective local brooder for 200 day-old broiler chicks without expensive commercial heating grids?",
    askerName: "Grace Akello",
    askerEmail: "grace.akello@example.com",
    answerText: "You can build an excellent low-cost brooder using a cardboard ring or timber panels:\n1. Construct a circular ring (brooder guard) to prevent chicks from piling in corners.\n2. Line the floor with 3-4 inches of dry wood shavings (avoid sawdust as chicks eat it).\n3. For heating, use 2-3 standard charcoal stoves (sigiris) placed safely inside clay pots with mesh screens, or hung 250W infrared bulbs if grid power is available.\n4. Monitor chick behavior: if they bunch together near the heat, they are cold; if they disperse far, they are too hot; if scattered evenly, the temperature is perfect.",
    answeredBy: "Ronald Opio - Poultry Expert",
    dateAsked: Date.now() - 800000,
    dateAnswered: Date.now() - 700000,
    isAnswered: true,
    category: "Animals",
    upvotes: 24
  },
  {
    questionText: "What are the first steps to restore depleted, sandy soil that has been continuously farmed for maize over five seasons?",
    askerName: "Moses Odongo",
    askerEmail: "moses.od@example.com",
    answerText: "Continuous monocropping depletes organic matter and nutrients. Restore it with these strategies:\n1. Grow cover crops (like cowpeas, Mucuna, or alfalfa) and till them back into the soil (green manure).\n2. Incorporate large amounts of well-composted farmyard manure (cow or poultry manure).\n3. Implement crop rotation; rotate maize with nitrogen-fixing legumes (beans, groundnuts).\n4. Rest a section of the land (fallowing) if possible to let biological activity recover.",
    answeredBy: "Ronald Opio - Crop Consultant",
    dateAsked: Date.now() - 600000,
    dateAnswered: Date.now() - 500000,
    isAnswered: true,
    category: "Crops",
    upvotes: 15
  }
];

export default function QuestionsAnswers({ isAdmin, activeQuestionId, onClearActiveQuestion }: QuestionsAnswersProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ask Question Form States
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [askerName, setAskerName] = useState("");
  const [askerEmail, setAskerEmail] = useState("");
  const [category, setCategory] = useState<Question["category"]>("Crops");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [askSuccess, setAskSuccess] = useState(false);

  // Answering States (Admin)
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "questions"), orderBy("dateAsked", "desc"));
      const snapshot = await getDocs(q);
      const loaded: Question[] = [];
      snapshot.forEach((doc) => {
        loaded.push({ id: doc.id, ...doc.data() } as Question);
      });

      if (loaded.length === 0) {
        // Seed if empty
        const promises = INITIAL_QUESTIONS.map(async (item) => {
          try {
            const docRef = await addDoc(collection(db, "questions"), item);
            return { id: docRef.id, ...item } as Question;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, "questions");
            throw err;
          }
        });
        const seeded = await Promise.all(promises);
        setQuestions(seeded);
      } else {
        setQuestions(loaded);
      }
    } catch (err) {
      console.error("Error loading questions:", err);
      handleFirestoreError(err, OperationType.LIST, "questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !askerName.trim()) return;
    setSubmittingQuestion(true);

    try {
      const newQuestion: Omit<Question, "id"> = {
        questionText: questionText.trim(),
        askerName: askerName.trim(),
        askerEmail: askerEmail.trim() || undefined,
        isAnswered: false,
        category,
        upvotes: 0,
        dateAsked: Date.now()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "questions"), newQuestion);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "questions");
        throw err;
      }
      setQuestions((prev) => [{ id: docRef.id, ...newQuestion } as Question, ...prev]);
      
      setAskSuccess(true);
      setQuestionText("");
      setAskerName("");
      setAskerEmail("");
      
      setTimeout(() => {
        setShowAskForm(false);
        setAskSuccess(false);
      }, 1500);

    } catch (err) {
      console.error("Error posting question:", err);
      alert("Failed to submit question.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleUpvote = async (qId: string) => {
    try {
      const item = questions.find((q) => q.id === qId);
      if (!item) return;

      const newUpvotes = item.upvotes + 1;
      await updateDoc(doc(db, "questions", qId), { upvotes: newUpvotes });

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, upvotes: newUpvotes } : q))
      );
    } catch (err) {
      console.error("Error upvoting:", err);
      handleFirestoreError(err, OperationType.UPDATE, `questions/${qId}`);
    }
  };

  const handleAnswerSubmit = async (qId: string) => {
    if (!answerText.trim()) return;
    setSubmittingAnswer(true);

    try {
      await updateDoc(doc(db, "questions", qId), {
        answerText: answerText.trim(),
        answeredBy: "Ronald Opio - Agricultural Consultant",
        dateAnswered: Date.now(),
        isAnswered: true
      });

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qId
            ? {
                ...q,
                answerText: answerText.trim(),
                answeredBy: "Ronald Opio - Agricultural Consultant",
                dateAnswered: Date.now(),
                isAnswered: true
              }
            : q
        )
      );

      setAnsweringId(null);
      setAnswerText("");
    } catch (err) {
      console.error("Error answering question:", err);
      handleFirestoreError(err, OperationType.UPDATE, `questions/${qId}`);
      alert("Failed to answer question. Verify permissions.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await deleteDoc(doc(db, "questions", qId));
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      if (activeQuestionId === qId) {
        onClearActiveQuestion();
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      handleFirestoreError(err, OperationType.DELETE, `questions/${qId}`);
    }
  };

  const shareLink = (qId: string) => {
    // Build a shareable link using the current URL format + query param
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?questionId=${qId}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(qId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // If we are looking at a specific question through link-sharing
  const sharedQuestion = activeQuestionId ? questions.find((q) => q.id === activeQuestionId) : null;

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory = (() => {
      if (activeCategory === "All") return true;
      if (activeCategory === "Unanswered") return !q.isAnswered;
      return q.category === activeCategory;
    })();
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (q.answerText && q.answerText.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          q.askerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="questions-answers-section" className="space-y-6">
      {/* Question Detail View for shared link */}
      {sharedQuestion ? (
        <div className="bg-emerald-50/50 dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <button
            onClick={onClearActiveQuestion}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Questions & Answers</span>
          </button>

          <div className="bg-white dark:bg-slate-950/40 p-6 rounded-2xl border border-emerald-100/50 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                  {sharedQuestion.category} Question
                </span>
                <h3 className="font-display font-medium text-lg text-slate-900 dark:text-white leading-relaxed">
                  "{sharedQuestion.questionText}"
                </h3>
                <p className="text-[11px] text-slate-400">
                  Asked by <strong className="text-slate-600 dark:text-slate-300">{sharedQuestion.askerName}</strong> on {new Date(sharedQuestion.dateAsked).toLocaleDateString()}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleDeleteQuestion(sharedQuestion.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {sharedQuestion.isAnswered ? (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  <Check className="w-4.5 h-4.5" />
                  <span>Expert Answer:</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {sharedQuestion.answerText}
                </p>
                <p className="text-[10px] text-slate-400 text-right font-medium italic">
                  Answered by {sharedQuestion.answeredBy}
                </p>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 text-xs italic">This question hasn't been answered yet by the consultant.</p>
                {isAdmin && (
                  <div className="mt-4 space-y-2">
                    <textarea
                      placeholder="Write your agricultural answer..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      onClick={() => handleAnswerSubmit(sharedQuestion.id)}
                      disabled={submittingAnswer}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl"
                    >
                      Publish Answer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Normal Q&A Feed */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-600" />
                <span>Agricultural Q&A Hub</span>
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Browse answered crop & livestock inquiries, ask your questions directly, and copy direct links to share solutions with other farmers.
              </p>
            </div>

            <button
              onClick={() => setShowAskForm(!showAskForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md transition-all self-start md:self-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>{showAskForm ? "Close Form" : "Ask a Question"}</span>
            </button>
          </div>

          {/* Ask Question Form */}
          {showAskForm && (
            <form onSubmit={handleAskQuestion} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">
                Submit your Question to the Expert
              </h3>

              {askSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs border border-emerald-100">
                  <CheckCircle className="w-4 h-4" />
                  <span>Question submitted successfully! It will appear below for the expert to answer.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={askerName}
                    onChange={(e) => setAskerName(e.target.value)}
                    placeholder="e.g. Peter Ayella"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={askerEmail}
                    onChange={(e) => setAskerEmail(e.target.value)}
                    placeholder="For private notification updates"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Question Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Question["category"])}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Crops">Crops & Soil</option>
                    <option value="Animals">Livestock & Poultry</option>
                    <option value="General">General Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your Detailed Question *</label>
                  <textarea
                    required
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Describe symptoms, breed types, farming duration, feeding rations, and crop types to help the expert formulate a precise solution."
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingQuestion}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {submittingQuestion ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Question...</span>
                  </>
                ) : (
                  <span>Submit Question</span>
                )}
              </button>
            </form>
          )}

          {/* Filter and Search controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap gap-2 flex-1">
              {["All", "Crops", "Animals", "General", "Unanswered"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                    activeCategory === cat
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Questions Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Loading farmer consultations feed...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 text-center py-12 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">No questions found</h4>
              <p className="text-slate-400 text-xs mt-1">Be the first to submit a question to the expert!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => (
                <div 
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:border-slate-200 dark:hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-md">
                          {q.category}
                        </span>
                        {!q.isAnswered && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">
                            Pending Response
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-medium text-sm text-slate-800 dark:text-white leading-relaxed">
                        "{q.questionText}"
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Asked by <strong className="text-slate-600 dark:text-slate-300">{q.askerName}</strong> on {new Date(q.dateAsked).toLocaleDateString()}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-50 transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {q.isAnswered ? (
                    <div className="pl-4 border-l-2 border-emerald-500 space-y-1 bg-emerald-50/20 dark:bg-slate-950/20 p-3.5 rounded-r-xl">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {q.answerText}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[9px] text-slate-400 font-bold italic">
                          Response from: {q.answeredBy}
                        </p>
                        {q.dateAnswered && (
                          <p className="text-[9px] text-slate-400">
                            {new Date(q.dateAnswered).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    isAdmin && answeringId !== q.id && (
                      <button
                        onClick={() => {
                          setAnsweringId(q.id);
                          setAnswerText("");
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                      >
                        Provide Expert Answer
                      </button>
                    )
                  )}

                  {answeringId === q.id && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Formulate Expert Answer</h5>
                      <textarea
                        required
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write clear, supportive recommendations with numbered steps..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnswerSubmit(q.id)}
                          disabled={submittingAnswer || !answerText.trim()}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg"
                        >
                          Submit Answer
                        </button>
                        <button
                          onClick={() => setAnsweringId(null)}
                          className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions (Like, Share) */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-50 dark:border-slate-800/60 text-slate-500 text-xs">
                    <button
                      onClick={() => handleUpvote(q.id)}
                      className="flex items-center gap-1 hover:text-emerald-600 transition-colors py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{q.upvotes} {q.upvotes === 1 ? "Upvote" : "Upvotes"}</span>
                    </button>

                    <button
                      onClick={() => shareLink(q.id)}
                      className="flex items-center gap-1 hover:text-emerald-600 transition-colors py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                    >
                      {copiedId === q.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Question Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
