"use client";

import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Preferences = {
  worktime: string;
  workdays: string[];
  workstyle: string;
  assignmentplan: string;
  dailyLimit: number;
  additionalInfo: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TOTAL_STEPS = 6;
const STEP_LABELS = ["Work Time", "Work Days", "Break Style", "Assignments", "Productivity", "Extra Notes"];

const WORKTIME_OPTIONS = [
  { value: "morning", label: "Morning", description: "6am-12pm" },
  { value: "afternoon", label: "Afternoon", description: "12pm-6pm" },
  { value: "evening", label: "Evening", description: "6pm-12am" },
];

const WORKSTYLE_OPTIONS = [
  { value: "short", label: "Short Bursts", description: "15-20 min sessions" },
  { value: "classic", label: "Classic Pomodoro", description: "25-30 min sessions" },
  { value: "deep-work", label: "Deep Work", description: "45-60 min sessions" },
  { value: "full-immersion", label: "Full Immersion", description: "90+ min sessions" },
];

const ASSIGNMENT_OPTIONS = [
  { value: "early", label: "Start Early", description: "Small chunks over multiple days" },
  { value: "deadline", label: "Deadline Sprint", description: "One larger effort close to due date" },
  { value: "balanced", label: "Balanced", description: "A few focused sessions spread out" },
];

const inputClassName =
  "w-full rounded-xl border border-slate-300/85 bg-white/85 px-4 py-2.5 text-slate-900 transition-all duration-200 outline-none focus:border-[#306844] focus:ring-2 focus:ring-[#306844]/30 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-white";

export default function Quiz() {
  const { preferences: savedPreferences, loadPreferences } = usePlanner();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [preferences, setPreferences] = useState<Preferences>({
    worktime: "",
    workdays: [],
    workstyle: "",
    assignmentplan: "",
    dailyLimit: 4,
    additionalInfo: "",
  });
  const [hasEdited, setHasEdited] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState("4");

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
          dailyLimit: savedPreferences.dailyLimit,
          additionalInfo: savedPreferences.additionalInfo,
        }
      : preferences;
  const progress = Math.round((step / TOTAL_STEPS) * 100);

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

    if (
      !currentPreferences.worktime ||
      currentPreferences.workdays.length === 0 ||
      !currentPreferences.workstyle ||
      !currentPreferences.assignmentplan
    ) {
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

    const payload = {
      worktime: currentPreferences.worktime,
      workdays: currentPreferences.workdays,
      workstyle: currentPreferences.workstyle,
      assignmentplan: currentPreferences.assignmentplan,
      daily_study_limit: currentPreferences.dailyLimit,
      additional_info: currentPreferences.additionalInfo,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      setIsSaving(false);
      setErrorMessage(updateError.message);
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...payload }, { onConflict: "id" });

      if (upsertError) {
        setIsSaving(false);
        setErrorMessage(upsertError.message);
        return;
      }
    }

    await loadPreferences();
    setErrorMessage("Preferences saved. Redirecting to dashboard...");
    setTimeout(() => {
      router.replace("/dashboard");
    }, 900);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="fixed inset-0 -z-30 bg-focus-light bg-cover bg-center dark:bg-focus-dark" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_38%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_45%_90%,rgba(99,102,241,0.15),transparent_42%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/25 via-white/10 to-white/45 dark:from-slate-900/35 dark:via-slate-900/15 dark:to-slate-950/55" />

      <main className="w-full flex-1">
        <div className="mx-auto max-w-4xl p-4 pb-12 sm:p-6 lg:p-8">
          <div className="quiz-panel rounded-3xl border border-white/50 bg-white/65 p-5 shadow-[0_30px_120px_-48px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-800/55 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Preference Quiz</h1>
              <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300\">
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {STEP_LABELS.map((label, index) => {
                const stepNumber = index + 1;
                      const isCurrent = step === stepNumber;
                      const isDone = step > stepNumber;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setStep(stepNumber)}
                          className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition ${
                            isCurrent
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : isDone
                              ? "border-slate-200 bg-white/80 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200"
                              : "border-slate-200/70 bg-white/55 text-slate-400 dark:border-slate-700 dark:bg-slate-900/25 dark:text-slate-400"
                          } hover:-translate-y-0.5 hover:shadow-sm`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/85 dark:bg-slate-700/55">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-[#306844] via-[#2f7f54] to-[#5ac693] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-xl border border-rose-300/70 bg-rose-50/90 p-3 text-sm font-medium text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/10 dark:text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-6">
                  <div className="min-h-[320px]">
                    {step === 1 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Preferred Work Time</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">When do you usually feel your focus is strongest?</p>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {WORKTIME_OPTIONS.map((option) => {
                          const isSelected = currentPreferences.worktime === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setHasEdited(true);
                                setPreferences({ ...currentPreferences, worktime: option.value });
                              }}
                              className={`min-h-[116px] rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-50/85 shadow-sm dark:border-emerald-500/45 dark:bg-emerald-500/10"
                                  : "border-slate-200/80 bg-white/90 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700/75 dark:bg-slate-800/65 dark:hover:border-emerald-500/35"
                              }`}
                            >
                              <p className="font-bold text-slate-900 dark:text-white">{option.label}</p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                            </button>
                          );
                        })}
                      </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Preferred Work Days</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">Pick your usual study days for better schedule generation.</p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {DAYS.map((day) => {
                          const checked = currentPreferences.workdays.includes(day);
                          return (
                            <label
                              key={day}
                              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                checked
                                  ? "border-emerald-300 bg-emerald-50/85 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "border-slate-200/80 bg-white/90 text-slate-700 hover:border-emerald-200 dark:border-slate-700/75 dark:bg-slate-800/65 dark:text-slate-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                value={day}
                                checked={checked}
                                onChange={(e) => toggleWorkday(day, e.target.checked)}
                                className="h-4 w-4 accent-[#306844]"
                              />
                              <span>{day}</span>
                            </label>
                          );
                        })}
                      </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Break Timings</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">How long can you focus before needing a break?</p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {WORKSTYLE_OPTIONS.map((option) => {
                          const isSelected = currentPreferences.workstyle === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setHasEdited(true);
                                setPreferences({ ...currentPreferences, workstyle: option.value });
                              }}
                              className={`min-h-[116px] rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-50/85 shadow-sm dark:border-emerald-500/45 dark:bg-emerald-500/10"
                                  : "border-slate-200/80 bg-white/90 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700/75 dark:bg-slate-800/65 dark:hover:border-emerald-500/35"
                              }`}
                            >
                              <p className="font-bold text-slate-900 dark:text-white">{option.label}</p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                            </button>
                          );
                        })}
                      </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Assignment Plan</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">How do you usually like to approach assignment work?</p>

                      <div className="space-y-3">
                        {ASSIGNMENT_OPTIONS.map((option) => {
                          const isSelected = currentPreferences.assignmentplan === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setHasEdited(true);
                                setPreferences({ ...currentPreferences, assignmentplan: option.value });
                              }}
                              className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                                isSelected
                                  ? "border-emerald-300 bg-emerald-50/85 shadow-sm dark:border-emerald-500/45 dark:bg-emerald-500/10"
                                  : "border-slate-200/80 bg-white/90 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700/75 dark:bg-slate-800/65 dark:hover:border-emerald-500/35"
                              }`}
                            >
                              <p className="font-bold text-slate-900 dark:text-white">{option.label}</p>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{option.description}</p>
                            </button>
                          );
                        })}
                      </div>
                      </div>
                    )}

                    {step === 5 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Daily Study Limit</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">Set your preferred max hours per day for schedule generation.</p>

                      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700/75 dark:bg-slate-800/65">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={currentPreferences.dailyLimit}
                            onChange={(e) => {
                              const normalized = Math.min(12, Math.max(1, parseInt(e.target.value) || 1));
                              setHasEdited(true);
                              setDailyLimitInput(String(normalized));
                              setPreferences({
                                ...currentPreferences,
                                dailyLimit: normalized,
                              });
                            }}
                            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#306844]"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              min={1}
                              max={12}
                              value={hasEdited ? dailyLimitInput : String(currentPreferences.dailyLimit)}
                              inputMode="numeric"
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
                                setDailyLimitInput(raw);
                                if (raw.length === 0) return;

                                const value = Number.parseInt(raw, 10);
                                if (!Number.isFinite(value)) return;
                                setHasEdited(true);
                                setPreferences({
                                  ...currentPreferences,
                                  dailyLimit: Math.min(12, Math.max(1, value)),
                                });
                              }}
                              onBlur={() => {
                                const parsed = Number.parseInt(dailyLimitInput, 10);
                                const normalized = Number.isFinite(parsed)
                                  ? Math.min(12, Math.max(1, parsed))
                                  : Math.min(12, Math.max(1, currentPreferences.dailyLimit || 4));

                                setDailyLimitInput(String(normalized));
                                setHasEdited(true);
                                setPreferences({
                                  ...currentPreferences,
                                  dailyLimit: normalized,
                                });
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-slate-900 outline-none focus:border-[#306844] focus:ring-2 focus:ring-[#306844]/25 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">h</span>
                          </div>
                        </div>

                      </div>
                      </div>
                    )}

                    {step === 6 && (
                      <div>
                      <h2 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">Additional Information</h2>
                      <p className="mb-5 text-slate-600 dark:text-slate-300">Share anything that can help us personalize your plan better.</p>
                      <textarea
                        className={inputClassName}
                        rows={6}
                        value={currentPreferences.additionalInfo}
                        onChange={(e) => {
                          setHasEdited(true);
                          setPreferences({ ...currentPreferences, additionalInfo: e.target.value });
                        }}
                        placeholder="Examples: part-time work, commute schedule, peak stress days, etc."
                      />
                      </div>
                    )}
                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-700/65">
                    <button
                      onClick={prevStep}
                      disabled={step === 1 || isSaving}
                      className="rounded-xl border border-slate-300 bg-white/90 px-5 py-2.5 font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600/75 dark:bg-slate-800/75 dark:text-slate-200"
                    >
                      Previous
                    </button>

                    {step < TOTAL_STEPS ? (
                      <button
                        onClick={nextStep}
                        className="rounded-xl bg-[#306844] px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#255236] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={submitQuiz}
                        disabled={isSaving}
                        className="rounded-xl bg-[#306844] px-6 py-2.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#255236] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        {isSaving ? "Saving... Redirecting to dashboard" : "Submit"}
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </div>

          <style jsx>{`
            .quiz-panel {
              animation: quizFadeIn 500ms cubic-bezier(0.22, 1, 0.36, 1);
            }

            @keyframes quizFadeIn {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .quiz-panel {
                animation: none;
              }
            }
          `}</style>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
