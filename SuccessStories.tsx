import React from "react";
import { Quote, Star, TrendingUp } from "lucide-react";

const stories = [
  {
    id: "1",
    name: "Samuel O.",
    location: "Gulu District",
    quote: "The soil management training changed everything. My maize yield increased by 40% this season just by applying the exact organic fertilizer ratios they taught us.",
    result: "40% Yield Increase",
    category: "Training"
  },
  {
    id: "2",
    name: "Aisha N.",
    location: "Mbale",
    quote: "I bought the drought-resistant bean seeds from the marketplace. Even with the delayed rains, my crop survived and I had a successful harvest.",
    result: "Drought Survival",
    category: "Agro-Inputs"
  },
  {
    id: "3",
    name: "John K.",
    location: "Masaka",
    quote: "The veterinary consultation saved my poultry farm. The expert diagnosed the respiratory issue quickly and the recommended medication worked perfectly.",
    result: "Saved 500 Birds",
    category: "Consultation"
  }
];

export default function SuccessStories() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Success Stories</span>
        </h3>
      </div>
      
      <div className="space-y-4">
        {stories.map((story) => (
          <div key={story.id} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
            <Quote className="absolute top-4 right-4 w-6 h-6 text-emerald-600/10 dark:text-emerald-400/10" />
            
            <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-3 leading-relaxed relative z-10">
              "{story.quote}"
            </p>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{story.name}</p>
                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{story.location}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-bold">{story.result}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
