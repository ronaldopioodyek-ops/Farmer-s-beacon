import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Training } from "../types";
import { 
  Award, 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  BookOpen, 
  User, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Compass
} from "lucide-react";

interface TrainingsProps {
  isAdmin: boolean;
}

const INITIAL_TRAININGS: Omit<Training, "id">[] = [
  {
    title: "Commercial Poultry Farming: Rearing to Marketing",
    description: "A practical guide to feeding patterns, bio-security measures, vaccination calendars, and optimized egg/meat productivity methods for poultry farmers.",
    date: "July 24, 2026",
    location: "Gulu Agricultural Demonstration Farm",
    skillsCovered: ["Vaccination Calendars", "Feeding Automation", "Bio-Security", "Broiler/Layer Feed Mix"],
    instructorBio: "Agronomist and Animal Husbandry Expert with over 12 years of hands-on farm consultation experience.",
    duration: "Full-day Workshop (9am - 5pm)",
    imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400",
    createdAt: Date.now() - 500000
  },
  {
    title: "Organic Pest Defense & Crop Protection",
    description: "Learn how to prepare organic pesticide formulations, understand crop pathology diagnostics, and manage worm infestations using eco-friendly natural sprays.",
    date: "August 12, 2026",
    location: "Online Webinar (Zoom)",
    skillsCovered: ["Organic Pest Control", "Crop Pathology", "Foliar Spray Formulation", "Infestation Diagnosis"],
    instructorBio: "Certified Crop Protection Specialist specializing in organic disease management methods.",
    duration: "2-Hour Intensive Webinar",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=400",
    createdAt: Date.now() - 300000
  }
];

const EXPERT_SKILLS = [
  "Crop Pathology & Disease Diagnostics",
  "Veterinary Care & Livestock Husbandry",
  "Soil Testing & Organic Fertilizers",
  "Poultry Farm Architecture & Brooding",
  "Drip Irrigation Systems & Soil Moisture Control",
  "Agricultural Business Planning & Cooperative Organization"
];

export default function Trainings({ isAdmin }: TrainingsProps) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Registration Dialog State
  const [registeringTraining, setRegisteringTraining] = useState<Training | null>(null);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Form States for adding Training
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [skillsCoveredStr, setSkillsCoveredStr] = useState("");
  const [instructorBio, setInstructorBio] = useState("Agricultural & Animal Expert Ronald Opio");
  const [duration, setDuration] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "trainings"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const loaded: Training[] = [];
      snapshot.forEach((doc) => {
        loaded.push({ id: doc.id, ...doc.data() } as Training);
      });

      if (loaded.length === 0) {
        // Seed if empty
        const promises = INITIAL_TRAININGS.map(async (item) => {
          try {
            const docRef = await addDoc(collection(db, "trainings"), item);
            return { id: docRef.id, ...item } as Training;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, "trainings");
            throw err;
          }
        });
        const seeded = await Promise.all(promises);
        setTrainings(seeded);
      } else {
        setTrainings(loaded);
      }
    } catch (err) {
      console.error("Error fetching trainings:", err);
      handleFirestoreError(err, OperationType.LIST, "trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const finalImageUrl = imageUrl.trim() || "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400";
      const skillsArray = skillsCoveredStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const newItem: Omit<Training, "id"> = {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        location: location.trim(),
        skillsCovered: skillsArray.length > 0 ? skillsArray : ["General Agriculture"],
        instructorBio: instructorBio.trim(),
        duration: duration.trim(),
        imageUrl: finalImageUrl,
        createdAt: Date.now()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "trainings"), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "trainings");
        throw err;
      }
      setTrainings((prev) => [{ id: docRef.id, ...newItem }, ...prev]);
      setFormSuccess(true);

      // Clear fields
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setSkillsCoveredStr("");
      setDuration("");
      setImageUrl("");

      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to create training.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this training program?")) return;

    try {
      await deleteDoc(doc(db, "trainings", id));
      setTrainings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting training:", err);
      handleFirestoreError(err, OperationType.DELETE, `trainings/${id}`);
      alert("Failed to delete training.");
    }
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringTraining) return;
    setRegSubmitting(true);

    try {
      // Store registration interest in Firestore
      await addDoc(collection(db, "training_registrations"), {
        trainingId: registeringTraining.id,
        trainingTitle: registeringTraining.title,
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        registeredAt: Date.now()
      });

      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setRegisteringTraining(null);
        setRegName("");
        setRegEmail("");
        setRegPhone("");
      }, 2000);

    } catch (err) {
      console.error("Booking error:", err);
      handleFirestoreError(err, OperationType.CREATE, "training_registrations");
      alert("Failed to register. Please try again.");
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <div id="trainings-section" className="space-y-8">
      {/* Bio and Skills Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Instructor & Consultant</span>
            </div>
            <h3 className="font-display font-semibold text-2xl md:text-3xl">Expert Agro-Training & Consulting</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Equipping farmers with modern crop science, husbandry, poultry disease prevention, soil preservation techniques, and optimized yield management frameworks.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 w-full md:w-80 shrink-0">
            <h4 className="font-display font-semibold text-sm text-emerald-400 flex items-center gap-1.5 mb-3">
              <Compass className="w-4 h-4" />
              <span>Core Skills & Expertise</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {EXPERT_SKILLS.map((skill, index) => (
                <span 
                  key={index}
                  className="px-2.5 py-1 bg-slate-950/60 text-slate-300 text-[10px] font-medium rounded-lg border border-slate-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Trainings and Workshops */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5.5 h-5.5 text-emerald-600" />
              <span>Upcoming Training Sessions & Masterclasses</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure your slot in agricultural masterclasses designed to elevate farm profitability.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md transition-all self-start md:self-auto"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>{showForm ? "Close Form" : "Create Masterclass"}</span>
            </button>
          )}
        </div>

        {/* Create Masterclass Form */}
        {showForm && isAdmin && (
          <form onSubmit={handleCreateTraining} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">
              Create a New Agricultural Training Program
            </h3>

            {formSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span>Training program posted!</span>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Program Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Poultry Disease Control Masterclass"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date/Schedule *</label>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g., July 24, 2026 at 10:00 AM"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Gulu Farm, or Online Zoom"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Duration *</label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 3 hours, Full-day"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Skills Covered (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={skillsCoveredStr}
                  onChange={(e) => setSkillsCoveredStr(e.target.value)}
                  placeholder="e.g., Feeding, Vaccines, Disease Care, Brooder Design"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Program Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will the farmers learn? What prerequisites are required?"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing masterclass...</span>
                </>
              ) : (
                <span>Publish Masterclass</span>
              )}
            </button>
          </form>
        )}

        {/* Loading Trainings */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Loading upcoming masterclasses...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainings.map((t) => (
              <div 
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between md:flex-row gap-5"
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">
                      {t.title}
                    </h3>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {t.skillsCovered.map((skill, sIdx) => (
                        <span 
                          key={sIdx}
                          className="px-2 py-0.5 bg-emerald-50/70 text-emerald-700 text-[10px] font-bold rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{t.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{t.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>{t.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setRegisteringTraining(t)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-all shadow-md"
                    >
                      Book Slot & Inquire
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteTraining(t.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove training"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-36 h-40 md:h-full rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={t.imageUrl}
                    alt={t.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registering Interest Modal */}
      {registeringTraining && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Book Slot</span>
                <h3 className="font-display font-semibold text-base text-slate-900 mt-1">
                  {registeringTraining.title}
                </h3>
              </div>
              <button
                onClick={() => setRegisteringTraining(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {regSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-display font-semibold text-slate-800">Booking Saved Successfully!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  We've reserved your interest slot. The expert will contact you directly via phone or email to coordinate payments and logistics.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookSlot} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. David Okello"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. david@gmail.com"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +256 770 000 000"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {regSubmitting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Confirm Booking Interest</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
