"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { setSession } from "@/lib/snapfix-session";

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) {
      alert("נא להזין שם תצוגה");
      return;
    }
    if (password.length < 4) {
      alert("הסיסמה צריכה להכיל לפחות 4 תווים");
      return;
    }
    if (password !== confirm) {
      alert("הסיסמאות אינן תואמות");
      return;
    }
    setSession({ displayName: name, role: "civilian" });
    router.push("/");
  }

  return (
    <main
      className="flex min-h-dvh flex-col bg-slate-950 px-4 py-[max(1rem,env(safe-area-inset-top))] pb-8 text-white"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-md pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowRight size={16} />
          חזרה למפה
        </Link>

        <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <UserPlus size={22} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">הרשמה</h1>
              <p className="mt-1 text-sm text-white/55">יצירת חשבון אזרחי לדיווחים</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-white/45">שם תצוגה</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="username"
                className="w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/50"
                placeholder="השם שיוצג במפה"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/45">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/45">אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/50"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-[1.1rem] border border-yellow-200/40 bg-yellow-400 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300 active:scale-[0.99]"
            >
              הרשמה והמשך למפה
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/45">
            כבר רשומים?{" "}
            <Link href="/" className="font-medium text-yellow-300/90 hover:text-yellow-200">
              חזרו למפה והתחברו מהכרטיס
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
