"use client";

import { useEffect, useState } from "react";
import { usePlanner } from "@/contexts/PlannerContext";

type ProfileData = {
  name: string;
  email: string;
  university: string;
  major: string;
};

export default function ProfilePage() {
  const { userId, tasks, courses } = usePlanner();
  const defaultProfile: ProfileData = {
    name: "Suganeshwara Anand",
    email: "suganeshwara@11planner.com",
    university: "Your University",
    major: "Computer Science",
  };
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfile);
  const [draftData, setDraftData] = useState<ProfileData>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  useEffect(() => {
    const savedProfile = localStorage.getItem("profileData");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile) as ProfileData;
        setProfileData(parsed);
        setDraftData(parsed);
      } catch {
        setProfileData(defaultProfile);
        setDraftData(defaultProfile);
      }
    }
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  const handleEditProfile = () => {
    setDraftData(profileData);
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    setProfileData(draftData);
    localStorage.setItem("profileData", JSON.stringify(draftData));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setDraftData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-emerald-200/40 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.2),transparent_55%)]" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-8 mb-6 border border-white/40 dark:border-slate-700/40">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {getInitials(profileData.name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {profileData.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">ID: {userId}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Member since February 2026</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalTasks}</p>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{completedTasks}</p>
            <p className="text-emerald-600 text-sm mt-2">{completionRate}% complete</p>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Courses</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{courses.length}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 border border-white/40 dark:border-slate-700/40">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={draftData.name}
                  onChange={(event) =>
                    setDraftData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-slate-900 dark:text-white">{profileData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={draftData.email}
                  onChange={(event) =>
                    setDraftData((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-slate-900 dark:text-white">{profileData.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                University
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={draftData.university}
                  onChange={(event) =>
                    setDraftData((prev) => ({ ...prev, university: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-slate-900 dark:text-white">{profileData.university}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Major
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={draftData.major}
                  onChange={(event) =>
                    setDraftData((prev) => ({ ...prev, major: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/80 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-slate-900 dark:text-white">{profileData.major}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-white/70 dark:bg-slate-800/70 hover:bg-white text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-6 rounded-xl transition border border-slate-200/80 dark:border-slate-700/80"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditProfile}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-lg shadow-green-900/10"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 mt-6 border border-white/40 dark:border-slate-700/40">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Overall Progress</h3>
          <div className="w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-3">
            You've completed {completedTasks} out of {totalTasks} tasks
          </p>
        </div>
      </div>
    </div>
  );
}
