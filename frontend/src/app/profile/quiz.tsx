"use client";

import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";

type Preferences = {
  worktime: string;
  workdays: string[];
  workstyle: string;
  assignmentplan: string;
  additionalInfo: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TOTAL_STEPS = 5;

const inputClassName =
  "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#306844] outline-none transition";

export default function Quiz() {
  const { preferences: savedPreferences, loadPreferences } = usePlanner();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [preferences, setPreferences] = useState<Preferences>({
    worktime: "",
    workdays: [],
    workstyle: "",
    assignmentplan: "",
    additionalInfo: "",
  });
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const currentPreferences: Preferences =
    !hasEdited && savedPreferences
      ? {
        worktime: savedPreferences.worktime,
        workdays: savedPreferences.workdays,
        workstyle: savedPreferences.workstyle,
        assignmentplan: savedPreferences.assignmentplan,
        additionalInfo: savedPreferences.additionalInfo,
      }
      : preferences;

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  function toggleWorkday(day: string, checked: boolean) {
    setHasEdited(true);
    setPreferences((prev) => ({
      ...prev,
      workdays: checked ? [...prev.workdays, day] : prev.workdays.filter((d) => d !== day),
    }));
  }

  async function submitQuiz() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPreferences.worktime || currentPreferences.workdays.length === 0 || !currentPreferences.workstyle || !currentPreferences.assignmentplan) {
      setErrorMessage("Please complete all required quiz fields before submitting.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("You must be logged in to save preferences.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        worktime: currentPreferences.worktime,
        workdays: currentPreferences.workdays,
        workstyle: currentPreferences.workstyle,
        assignmentplan: currentPreferences.assignmentplan,
        additional_info: currentPreferences.additionalInfo,
      })
      .eq("id", user.id);
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Preferences saved.");
    await loadPreferences();
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40">
          <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-8 mb-6 border border-white/40 dark:border-slate-600/40 border-t-4 border-t-[#306844]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Personalization Quiz</h1>
              <span className="text-sm font-semibold text-[#306844] bg-[#306844]/10 px-3 py-1 rounded-full">
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#306844] to-[#3d8658] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 border border-rose-200 bg-rose-50 text-rose-700 rounded-xl p-3 text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl p-3 text-sm flex items-center justify-between gap-3">
              <span>{successMessage}</span>
              <Link href="/profile" className="font-semibold hover:underline">
                Back to Profile
              </Link>
            </div>
          )}

          <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-8 border border-white/40 dark:border-slate-600/40">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Preferred Work Time</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5">When do you feel most productive?</p>
                <select
                  className={inputClassName}
                  value={currentPreferences.worktime}
                  onChange={(e) => {
                    setHasEdited(true);
                    setPreferences({ ...currentPreferences, worktime: e.target.value });
                  }}
                >
                  <option value="">Select</option>
                  <option value="morning">Morning (6am-12pm)</option>
                  <option value="afternoon">Afternoon (12pm-6pm)</option>
                  <option value="evening">Evening (6pm-12am)</option>
                </select>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Preferred Work Days</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5">Pick the days you usually like to work.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS.map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white"
                    >
                      <input
                        type="checkbox"
                        value={day}
                        checked={currentPreferences.workdays.includes(day)}
                        onChange={(e) => toggleWorkday(day, e.target.checked)}
                        className="accent-[#306844]"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Break Timings</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5">How long can you focus before taking a break?</p>
                <select
                  className={inputClassName}
                  value={currentPreferences.workstyle}
                  onChange={(e) => {
                    setHasEdited(true);
                    setPreferences({ ...currentPreferences, workstyle: e.target.value });
                  }}
                >
                  <option value="">Select</option>
                  <option value="short">15-20 minutes (short bursts)</option>
                  <option value="classic">25-30 minutes (classic Pomodoro)</option>
                  <option value="deep-work">45-60 minutes (deep work)</option>
                  <option value="full-immersion">90+ minutes (full immersion)</option>
                </select>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assignment Plan</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5">How do you prefer to approach assignments?</p>
                <select
                  className={inputClassName}
                  value={currentPreferences.assignmentplan}
                  onChange={(e) => {
                    setHasEdited(true);
                    setPreferences({ ...currentPreferences, assignmentplan: e.target.value });
                  }}
                >
                  <option value="">How do you prefer to do assignments?</option>
                  <option value="early">Start early and do a little each day</option>
                  <option value="deadline">One big session close to the deadline</option>
                  <option value="balanced">Balanced: a few sessions that are spread out</option>
                </select>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Additional Information</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5">Optional notes to improve your planning suggestions.</p>
                <textarea
                  className={inputClassName}
                  rows={6}
                  value={currentPreferences.additionalInfo}
                  onChange={(e) => {
                    setHasEdited(true);
                    setPreferences({ ...currentPreferences, additionalInfo: e.target.value });
                  }}
                  placeholder="Anything else you'd like us to know? (Optional)"
                />
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={step === 1 || isSaving}
                className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  onClick={nextStep}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={isSaving}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
