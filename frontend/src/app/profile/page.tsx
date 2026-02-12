"use client";

import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";


type ProfileData = {
  firstname: string;
  lastname: string;
  university: string;
  major: string;

}


export default function ProfilePage() {
  const { tasks, courses } = usePlanner();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<ProfileData | null>(null);

  useEffect(() => {

    async function fetchProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Error fetching user:", authError);
        return;
      }



      setEmail(user.email);
      setUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("firstname, lastname, university, major")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      setProfile(profileData);
      setEditProfile(profileData);
    }

    fetchProfile();
  }, []);

  async function saveProfile() {
    if (!editProfile || !userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        firstname: editProfile.firstname,
        lastname: editProfile.lastname,
        university: editProfile.university,
        major: editProfile.major,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
      return;
    }
    setProfile(editProfile);
    setEditing(false);
  }




  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark bg-cover bg-center -z-20"></div>


      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40">

          {/* Profile Header */}
          <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-8 mb-6 border border-white/40 dark:border-slate-600/40 border-t-4 border-t-[#306844]">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#306844] to-[#255236] rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {profile?.firstname?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {profile ? `${profile.firstname} ${profile.lastname}` : "Guest User"}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">ID: {userId}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-6 border-l-4 border-l-[#306844] border-y border-r border-white/40 dark:border-slate-600/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalTasks}</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-6 border-l-4 border-l-[#306844] border-y border-r border-white/40 dark:border-slate-600/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{completedTasks}</p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2">{completionRate}% complete</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-6 border-l-4 border-l-[#306844] border-y border-r border-white/40 dark:border-slate-600/40">
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Courses</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{courses.length}</p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-8 border border-white/40 dark:border-slate-600/40">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Email
                </label>
                <p className="text-slate-900 dark:text-white font-medium">{email || "Not logged in"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  University
                </label>

                {editing ? (
                  <input
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 w-full bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={editProfile?.university ?? ""}
                    onChange={(e) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, university: e.target.value } : prev
                      )
                    }
                  />
                ) : (
                  <p className="text-slate-900 dark:text-white font-medium">{profile?.university || "Not set"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Major
                </label>

                {editing ? (
                  <input
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 w-full bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={editProfile?.major ?? ""}
                    onChange={(e) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, major: e.target.value } : prev
                      )
                    }
                  />
                ) : (
                  <p className="text-slate-900 dark:text-white font-medium">{profile?.major || "Not set"}</p>
                )}
              </div>


              <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => {
                    if (editing) {
                      saveProfile();
                    } else {
                      setEditing(true);
                    }
                  }}
                  className="bg-[#306844] hover:bg-[#255236] text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                >
                  {editing ? "Save Profile" : "Edit Profile"}
                </button>

              </div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="bg-white/50 dark:bg-slate-700/50 rounded-2xl shadow-sm p-8 mt-6 border border-white/40 dark:border-slate-600/40">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Overall Progress</h3>
            <div className="w-full bg-slate-200 dark:bg-slate-600/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#306844] to-[#3d8658] h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 font-medium">
              You've completed <span className="text-slate-900 dark:text-white font-bold">{completedTasks}</span> out of {totalTasks} tasks
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
