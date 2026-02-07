"use client";

import { usePlanner } from "@/contexts/PlannerContext";
import { supabase } from "../auth/supabaseClient";
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
      const{
        data: {user},
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
    .from ("profiles")
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {profile ? `${profile.firstname} ${profile.lastname}` : "?"}
              </h1>

              <p className="text-slate-600 text-lg mt-2">ID: {userId}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
            <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalTasks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-green-500">
            <p className="text-slate-600 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{completedTasks}</p>
            <p className="text-green-600 text-sm mt-2">{completionRate}% complete</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-purple-500">
            <p className="text-slate-600 text-sm font-medium">Courses</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{courses.length}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <p className="text-slate-900">{email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                University
              </label>

              {editing ? (
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editProfile?.university ?? ""}
                  onChange={(e) =>
                    setEditProfile((prev) =>
                      prev ? { ...prev, university: e.target.value } : prev
                    )
                  }
                />
              ) : (
                <p className="text-slate-900">{profile?.university}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Major
              </label>

              {editing ? (
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={editProfile?.major ?? ""}
                  onChange={(e) =>
                    setEditProfile((prev) =>
                      prev ? { ...prev, major: e.target.value } : prev
                    )
                  }
                />
              ) : (
                <p className="text-slate-900">{profile?.major}</p>
              )}
            </div>


            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  if (editing) {
                    saveProfile();
                  } else {
                    setEditing(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {editing ? "Save Profile" : "Edit Profile"}
              </button>

            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Overall Progress</h3>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-slate-600 text-sm mt-3">
            You've completed {completedTasks} out of {totalTasks} tasks
          </p>
        </div>
      </div>
    </div>
  );
}
