"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList, Users } from "lucide-react";
import { clearSession, getSession, type SnapfixSession } from "@/lib/snapfix-session";

const REPORTS_KEY = "snapfix_reports";

type ReportItem = {
  id: string;
  city: string;
  street: string;
  type: string;
  description: string;
  createdAt: string;
};

export default function CiviWorkDashboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState<SnapfixSession | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "civi-work") {
      router.replace("/");
      return;
    }
    setSessionState(s);

    try {
      const raw = localStorage.getItem(REPORTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setReports(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  if (!session) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 text-white" dir="rtl">
        <p className="text-sm text-white/60">טוען…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-white" dir="rtl">
      <header className="border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">לוח בקרה — Civi-Work</h1>
            <p className="mt-1 text-sm text-white/55">
              שלום, {session.displayName} · ניהול דיווחים וצוותים (המשך יתווסף)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              <ArrowRight size={16} />
              מפה ציבורית
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-[1rem] border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              התנתקות
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-yellow-300" size={22} />
              <div>
                <div className="text-sm font-semibold">דיווחים פתוחים</div>
                <div className="mt-1 text-2xl font-bold">{reports.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Users className="text-white/45" size={22} />
              <div>
                <div className="text-sm font-semibold text-white/80">צוותים</div>
                <div className="mt-1 text-sm text-white/45">בקרוב: הקצאה ומעקב</div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-base font-semibold">כל הדיווחים (מקומי)</h2>
        {reports.length === 0 ? (
          <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
            אין דיווחים במערכת כרגע.
          </div>
        ) : (
          <ul className="space-y-3">
            {reports
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((r) => (
                <li
                  key={r.id}
                  className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-semibold">{r.type}</span>
                    <span className="text-xs text-white/45">
                      {new Date(r.createdAt).toLocaleString("he-IL")}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    {r.city}, {r.street}
                  </div>
                  <p className="mt-2 text-sm text-white/85">{r.description}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </main>
  );
}
