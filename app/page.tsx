"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/map/mapview";
import {
  MapPin,
  Map,
  Settings,
  User,
  Plus,
  X,
  Camera,
  ImagePlus,
  TriangleAlert,
  Trash2,
  ListFilter,
  CircleHelp,
  Bell,
  Moon,
  Sun,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  clearSession,
  getSession,
  setSession,
  type SnapfixSession,
  type UserRole,
} from "@/lib/snapfix-session";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  street: string;
};

type ReportItem = {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  street: string;
  type: string;
  description: string;
  imageName: string | null;
  /** Base64 data URL for thumbnail / lightbox (set on submit when a file is attached). */
  imageDataUrl?: string | null;
  createdAt: string;
};

type MapTheme = "light" | "dark";

const HAZARD_TYPES = [
  "בור בכביש",
  "מדרכה פגועה",
  "פח אשפה מלא",
  "תאורת רחוב תקולה",
  "רכב נטוש",
  "מפגע בטיחות",
  "לכלוך / פסולת",
  "אחר",
];

const STORAGE_KEY = "snapfix_reports";

export default function HomePage() {
  const router = useRouter();
  const [locationText, setLocationText] = useState("טוען מיקום...");
  const [currentLocation, setCurrentLocation] = useState<ResolvedLocation | null>(
    null
  );
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUserCardOpen, setIsUserCardOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [session, setSessionState] = useState<SnapfixSession | null>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("civilian");
  const [isMyReportsOpen, setIsMyReportsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportImage, setReportImage] = useState<File | null>(null);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [mapTheme, setMapTheme] = useState<MapTheme>("dark");

  const [selectedHazardFilters, setSelectedHazardFilters] = useState<string[]>([]);
  const [showOnlyReportsWithImage, setShowOnlyReportsWithImage] = useState(false);
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    const savedReports = localStorage.getItem(STORAGE_KEY);
    if (!savedReports) return;

    try {
      const parsed = JSON.parse(savedReports);
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReports(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }, [reports]);

  function closeAllPanels() {
    setIsUserCardOpen(false);
    setIsMyReportsOpen(false);
    setIsFiltersOpen(false);
    setIsHelpOpen(false);
    setIsSettingsOpen(false);
    setIsLoginModalOpen(false);
  }

  function openLoginModal() {
    setIsUserCardOpen(false);
    setIsMyReportsOpen(false);
    setIsFiltersOpen(false);
    setIsHelpOpen(false);
    setIsSettingsOpen(false);
    setIsLoginModalOpen(true);
  }

  function handleLogout() {
    clearSession();
    setSessionState(null);
    setIsUserCardOpen(false);
  }

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = loginUsername.trim();
    if (!name) {
      alert("נא להזין שם משתמש");
      return;
    }
    if (loginPassword.length < 1) {
      alert("נא להזין סיסמה");
      return;
    }

    const next: SnapfixSession = {
      displayName: name,
      role: loginRole,
    };
    setSession(next);
    setSessionState(next);
    setIsLoginModalOpen(false);
    setLoginPassword("");
    setLoginUsername("");

    if (loginRole === "civi-work") {
      router.push("/civi-work");
    }
  }

  const displayName = session?.displayName ?? "אורח";
  const accountSubtitle = session
    ? session.role === "civi-work"
      ? "עובד עירייה (Civi-Work)"
      : "אזרח רשום"
    : "חשבון לא מחובר";
  const statusLine = session
    ? session.role === "civi-work"
      ? "מחובר כעובד עירייה"
      : "מחובר כאזרח"
    : "ללא משתמש רשום";

  function togglePanel(panel: "user" | "reports" | "filters" | "help" | "settings") {
    const nextState = {
      user: false,
      reports: false,
      filters: false,
      help: false,
      settings: false,
    };

    switch (panel) {
      case "user":
        nextState.user = !isUserCardOpen;
        break;
      case "reports":
        nextState.reports = !isMyReportsOpen;
        break;
      case "filters":
        nextState.filters = !isFiltersOpen;
        break;
      case "help":
        nextState.help = !isHelpOpen;
        break;
      case "settings":
        nextState.settings = !isSettingsOpen;
        break;
      default:
        break;
    }

    closeAllPanels();
    setIsUserCardOpen(nextState.user);
    setIsMyReportsOpen(nextState.reports);
    setIsFiltersOpen(nextState.filters);
    setIsHelpOpen(nextState.help);
    setIsSettingsOpen(nextState.settings);
  }

  function handleLocationResolved(data: ResolvedLocation) {
    setCurrentLocation(data);

    const parts = [data.city, data.street].map((p) => p?.trim()).filter(Boolean);

    if (parts.length > 0) {
      setLocationText(parts.join(", "));
    } else {
      setLocationText("מיקום לא זוהה");
    }
  }

  function handleLocationError(message: string) {
    setLocationText(message || "שגיאת מיקום");
  }

  function openReportModal() {
    closeAllPanels();
    setIsReportModalOpen(true);
  }

  function closeReportModal() {
    setIsReportModalOpen(false);
  }

  function resetReportForm() {
    setReportType("");
    setReportDescription("");
    setReportImage(null);
  }

  function handleCancelReport() {
    resetReportForm();
    closeReportModal();
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setReportImage(file);
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleApproveReport() {
    if (!currentLocation) {
      alert("עדיין אין מיקום נוכחי");
      return;
    }

    if (!reportType) {
      alert("צריך לבחור סוג מפגע");
      return;
    }

    if (!reportDescription.trim()) {
      alert("צריך לכתוב תיאור קצר");
      return;
    }

    let imageDataUrl: string | null = null;
    if (reportImage) {
      try {
        imageDataUrl = await readFileAsDataUrl(reportImage);
      } catch {
        imageDataUrl = null;
      }
    }

    const newReport: ReportItem = {
      id: crypto.randomUUID(),
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      city: currentLocation.city,
      street: currentLocation.street,
      type: reportType,
      description: reportDescription.trim(),
      imageName: reportImage?.name ?? null,
      imageDataUrl,
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);
    resetReportForm();
    closeReportModal();
  }

  function handleDeleteReport(reportId: string) {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }

  function handleClearAllReports() {
    const confirmed = window.confirm("למחוק את כל דיווחי הבדיקה מהמפה?");
    if (!confirmed) return;
    setReports([]);
  }

  function handleDeleteFromList(reportId: string) {
    const confirmed = window.confirm("למחוק את הדיווח הזה?");
    if (!confirmed) return;
    handleDeleteReport(reportId);
  }

  function handleToggleHazardFilter(hazardType: string) {
    setSelectedHazardFilters((prev) =>
      prev.includes(hazardType)
        ? prev.filter((item) => item !== hazardType)
        : [...prev, hazardType]
    );
  }

  function resetFilters() {
    setSelectedHazardFilters([]);
    setShowOnlyReportsWithImage(false);
    setSortMode("newest");
  }

  const imagePreviewText = useMemo(() => {
    if (!reportImage) return "לא נבחרה תמונה";
    return reportImage.name;
  }, [reportImage]);

  const filteredReports = useMemo(() => {
    let nextReports = [...reports];

    if (selectedHazardFilters.length > 0) {
      nextReports = nextReports.filter((report) =>
        selectedHazardFilters.includes(report.type)
      );
    }

    if (showOnlyReportsWithImage) {
      nextReports = nextReports.filter((report) =>
        Boolean(report.imageDataUrl ?? report.imageName)
      );
    }

    nextReports.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortMode === "newest" ? bTime - aTime : aTime - bTime;
    });

    return nextReports;
  }, [reports, selectedHazardFilters, showOnlyReportsWithImage, sortMode]);

  const selectedMapThemeLabel = mapTheme === "dark" ? "כהה" : "בהיר";

  const panelButtonBaseClass =
    "flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95";

  return (
    <main
      className="relative h-[100dvh] min-h-0 w-full max-w-[100vw] overflow-hidden bg-slate-950"
      dir="rtl"
    >
      <MapView
        recenterTrigger={recenterTrigger}
        mapTheme={mapTheme}
        onLocationResolved={handleLocationResolved}
        onLocationError={handleLocationError}
        reports={filteredReports}
        onDeleteReport={handleDeleteReport}
      />

      <aside className="pointer-events-none absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 flex w-[min(220px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col sm:right-4 sm:top-4 sm:bottom-6 sm:w-[220px] sm:max-w-none">
        <div className="pointer-events-auto flex h-full min-h-0 flex-col gap-6 rounded-[1.8rem] border border-white/10 bg-slate-950/65 p-3 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => togglePanel("user")}
            className="flex w-full shrink-0 items-center justify-start rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-3 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10">
                <User size={18} className="text-white" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                <div className="truncate text-[11px] text-white/55">{accountSubtitle}</div>
              </div>
            </div>
          </button>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-2">
            <button onClick={openReportModal} className={panelButtonBaseClass}>
              <Plus size={17} className="text-yellow-300" />
              <span className="text-sm text-white">צור דיווח</span>
            </button>

            <button
              onClick={() => setRecenterTrigger((prev) => prev + 1)}
              className={panelButtonBaseClass}
            >
              <MapPin size={17} className="text-sky-300" />
              <span className="text-sm text-white">המיקום שלי</span>
            </button>

            <button
              onClick={() =>
                setMapTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
              className={panelButtonBaseClass}
            >
              <Map size={17} className="text-white" />
              <span className="flex items-center gap-2 text-sm text-white">
                סוג מפה
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                  {selectedMapThemeLabel}
                </span>
              </span>
            </button>

            <button
              onClick={() => togglePanel("reports")}
              className={panelButtonBaseClass}
            >
              <Bell size={17} className="text-white" />
              <span className="text-sm text-white">הדיווחים שלי</span>
            </button>

            <button
              onClick={() => togglePanel("filters")}
              className={panelButtonBaseClass}
            >
              <ListFilter size={17} className="text-white" />
              <span className="text-sm text-white">סינון</span>
            </button>

            <button
              onClick={() => togglePanel("help")}
              className={panelButtonBaseClass}
            >
              <CircleHelp size={17} className="text-white" />
              <span className="text-sm text-white">עזרה</span>
            </button>

            <button
              onClick={() => togglePanel("settings")}
              className={panelButtonBaseClass}
            >
              <Settings size={17} className="text-white" />
              <span className="text-sm text-white">הגדרות</span>
            </button>
          </div>

          <div className="shrink-0 rounded-[1.35rem] border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] font-medium text-white/45">Developer tools</div>

            <div className="mt-2 text-xs text-white/75">
              דיווחים על המפה: {reports.length}
            </div>

            <button
              onClick={handleClearAllReports}
              className="mt-3 flex w-full items-center gap-2 rounded-[1rem] border border-red-400/20 bg-red-500/10 px-3 py-2 text-right text-xs text-red-200 transition-all duration-150 hover:bg-red-500/15 active:scale-95"
            >
              <Trash2 size={14} />
              <span>נקה דיווחי בדיקה</span>
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={openReportModal}
        className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-yellow-200/30 bg-yellow-400 text-black shadow-2xl transition-all duration-150 hover:scale-105 hover:bg-yellow-300 active:scale-95 sm:bottom-6 sm:left-6 sm:h-16 sm:w-16"
        aria-label="צור דיווח"
      >
        <Plus className="h-7 w-7 sm:h-[30px] sm:w-[30px]" strokeWidth={2.5} />
      </button>

      {(isUserCardOpen ||
        isMyReportsOpen ||
        isFiltersOpen ||
        isHelpOpen ||
        isSettingsOpen ||
        isLoginModalOpen) && (
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-black/10"
          onClick={closeAllPanels}
        />
      )}

      {isUserCardOpen && (
        <div className="pointer-events-auto absolute inset-x-3 top-16 z-40 max-h-[min(85vh,640px)] w-auto overflow-y-auto rounded-[1.8rem] border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-[250px] sm:top-5 sm:max-h-none sm:w-[320px] sm:overflow-visible sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">כרטיס משתמש</h2>
              <p className="mt-1 text-sm text-white/60">מצב נוכחי של המשתמש במערכת</p>
            </div>

            <button
              onClick={() => setIsUserCardOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/45">שם תצוגה</div>
              <div className="mt-1 text-sm font-semibold">{displayName}</div>
            </div>

            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/45">סטטוס</div>
              <div className="mt-1 text-sm font-semibold">{statusLine}</div>
            </div>

            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/45">כמות דיווחים במכשיר הזה</div>
              <div className="mt-1 text-sm font-semibold">{reports.length}</div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-yellow-200/35 bg-yellow-400/95 px-4 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300 active:scale-[0.99]"
                >
                  <LogIn size={18} />
                  התחברות
                </button>
                <Link
                  href="/sign-up"
                  onClick={() => setIsUserCardOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.99]"
                >
                  <UserPlus size={18} />
                  הרשמה
                </Link>
              </div>
              {session && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-[1rem] border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
                >
                  התנתקות
                </button>
              )}
              {session?.role === "civi-work" && (
                <Link
                  href="/civi-work"
                  onClick={() => setIsUserCardOpen(false)}
                  className="flex w-full items-center justify-center rounded-[1rem] border border-white/10 py-2.5 text-sm text-yellow-200/90 transition hover:bg-white/10"
                >
                  מעבר ללוח בקרת עובדים
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div
          className="absolute inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/60 px-3 py-[max(0.75rem,env(safe-area-inset-bottom))] pt-12 sm:items-center sm:px-4 sm:py-6"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="pointer-events-auto mb-0 w-full max-w-md rounded-t-[1.8rem] border border-white/10 bg-slate-950/95 p-5 text-white shadow-2xl backdrop-blur-2xl sm:mb-0 sm:rounded-[1.8rem] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="login-title" className="text-lg font-semibold">
                  התחברות
                </h2>
                <p className="mt-1 text-sm text-white/55">הזינו פרטים ובחרו סוג משתמש</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-white/45">שם משתמש</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/45">סיסמה</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/50"
                />
              </div>

              <div>
                <div className="mb-2 text-xs text-white/45">סוג משתמש</div>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 transition has-[:checked]:border-yellow-300/50 has-[:checked]:bg-yellow-400/10">
                    <input
                      type="radio"
                      name="login-role"
                      checked={loginRole === "civilian"}
                      onChange={() => setLoginRole("civilian")}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span className="text-sm">אזרח (Civilian) — נשארים במפה</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 transition has-[:checked]:border-yellow-300/50 has-[:checked]:bg-yellow-400/10">
                    <input
                      type="radio"
                      name="login-role"
                      checked={loginRole === "civi-work"}
                      onChange={() => setLoginRole("civi-work")}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span className="text-sm">עובד עירייה (Civi-Work) — לוח ניהול</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="rounded-[1.1rem] border border-white/10 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="rounded-[1.1rem] border border-yellow-200/40 bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
                >
                  התחבר
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMyReportsOpen && (
        <div className="pointer-events-auto absolute inset-x-3 top-16 z-40 flex max-h-[min(85vh,640px)] w-auto flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-[250px] sm:top-24 sm:max-h-[70vh] sm:w-[420px]">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-lg font-semibold">הדיווחים שלי</h2>
              <p className="mt-1 text-sm text-white/60">רשימת הדיווחים שנשמרו כרגע בדפדפן</p>
            </div>

            <button
              onClick={() => setIsMyReportsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:max-h-[calc(70vh-82px)] sm:p-4">
            {reports.length === 0 ? (
              <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
                עדיין לא יצרת דיווחים.
              </div>
            ) : (
              <div className="space-y-3">
                {reports
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )
                  .map((report) => (
                    <div
                      key={report.id}
                      className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {report.type}
                          </div>
                          <div className="mt-1 text-xs text-white/50">
                            {new Date(report.createdAt).toLocaleString("he-IL")}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFromList(report.id)}
                          className="rounded-full border border-red-400/20 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/15"
                          aria-label="מחק דיווח"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-white/80">
                        <div>
                          <span className="text-white/45">מיקום: </span>
                          {report.city || "ללא עיר"}, {report.street || "ללא רחוב"}
                        </div>
                        <div>
                          <span className="text-white/45">תיאור: </span>
                          {report.description}
                        </div>
                        <div>
                          <span className="text-white/45">תמונה: </span>
                          {report.imageName ?? "ללא תמונה"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isFiltersOpen && (
        <div className="pointer-events-auto absolute inset-x-3 top-16 z-40 max-h-[min(85vh,640px)] w-auto overflow-y-auto rounded-[1.8rem] border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-[250px] sm:top-44 sm:max-h-none sm:w-[360px] sm:overflow-visible sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">סינון דיווחים</h2>
              <p className="mt-1 text-sm text-white/60">מה להציג על המפה כרגע</p>
            </div>

            <button
              onClick={() => setIsFiltersOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            <section>
              <div className="mb-2 text-sm font-semibold">סוגי מפגעים</div>
              <div className="flex flex-wrap gap-2">
                {HAZARD_TYPES.map((type) => {
                  const isActive = selectedHazardFilters.includes(type);

                  return (
                    <button
                      key={type}
                      onClick={() => handleToggleHazardFilter(type)}
                      className={`rounded-full border px-3 py-2 text-xs transition-all duration-150 ${
                        isActive
                          ? "border-yellow-300/60 bg-yellow-400 text-black"
                          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm">להציג רק דיווחים עם תמונה</span>
                <input
                  type="checkbox"
                  checked={showOnlyReportsWithImage}
                  onChange={(e) => setShowOnlyReportsWithImage(e.target.checked)}
                  className="h-4 w-4 accent-yellow-400"
                />
              </label>
            </section>

            <section className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-semibold">מיון</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortMode("newest")}
                  className={`flex-1 rounded-[1rem] border px-3 py-2 text-sm transition ${
                    sortMode === "newest"
                      ? "border-yellow-300/60 bg-yellow-400 text-black"
                      : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  חדש לישן
                </button>

                <button
                  onClick={() => setSortMode("oldest")}
                  className={`flex-1 rounded-[1rem] border px-3 py-2 text-sm transition ${
                    sortMode === "oldest"
                      ? "border-yellow-300/60 bg-yellow-400 text-black"
                      : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  ישן לחדש
                </button>
              </div>
            </section>

            <button
              onClick={resetFilters}
              className="w-full rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              אפס סינון
            </button>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="pointer-events-auto absolute inset-x-3 top-16 z-40 max-h-[min(85vh,640px)] w-auto overflow-y-auto rounded-[1.8rem] border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-[250px] sm:top-[330px] sm:max-h-none sm:w-[360px] sm:overflow-visible sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">עזרה</h2>
              <p className="mt-1 text-sm text-white/60">איך משתמשים ב-SnapFix</p>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 text-sm leading-6 text-white/80">
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              1. לחץ על <span className="font-semibold text-white">צור דיווח</span>.
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              2. בחר סוג מפגע, כתוב תיאור, והעלה תמונה אם צריך.
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              3. המיקום נלקח אוטומטית מהמכשיר שלך.
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              4. אחרי אישור, הדיווח יופיע מיד על המפה.
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="pointer-events-auto absolute inset-x-3 top-16 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-40 max-h-[min(75vh,520px)] w-auto overflow-y-auto rounded-[1.8rem] border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-5 sm:left-auto sm:right-[250px] sm:top-auto sm:max-h-none sm:w-[360px] sm:overflow-visible sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">הגדרות</h2>
              <p className="mt-1 text-sm text-white/60">אופציות בסיסיות ל-MVP</p>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMapTheme("light")}
              className={`flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                mapTheme === "light"
                  ? "border-yellow-300/60 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <span>מפה בהירה</span>
              <Sun size={16} />
            </button>

            <button
              onClick={() => setMapTheme("dark")}
              className={`flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                mapTheme === "dark"
                  ? "border-yellow-300/60 bg-yellow-400 text-black"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <span>מפה כהה</span>
              <Moon size={16} />
            </button>

            <button
              onClick={() => setRecenterTrigger((prev) => prev + 1)}
              className="flex w-full items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              <span>מרכז אותי מחדש על המפה</span>
              <MapPin size={16} />
            </button>

            <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              בהמשך אפשר להוסיף כאן שפה, התראות אמיתיות, מצב נגישות, והעדפות משתמש.
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 px-3 py-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 sm:items-center sm:px-4 sm:py-4">
          <div className="mb-0 w-full max-h-[min(92dvh,900px)] max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-2xl sm:mb-0 sm:rounded-[2rem] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">דיווח חדש</h2>
                <p className="mt-2 text-sm text-white/60">
                  מלא את הפרטים ושלח דיווח מהיר.
                </p>
              </div>

              <button
                onClick={handleCancelReport}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Camera size={16} />
                  תמונה / מצלמה
                </h3>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[1.1rem] border border-dashed border-white/15 bg-slate-900/70 px-4 py-5 text-sm text-white/75 transition hover:bg-slate-900">
                  <ImagePlus size={18} />
                  <span>צלם / העלה תמונה</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <div className="mt-3 text-xs text-white/45">{imagePreviewText}</div>
              </section>

              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <TriangleAlert size={16} />
                  סוג המפגע
                </h3>

                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all duration-150 focus:border-yellow-300/70"
                >
                  <option value="">בחר סוג מפגע</option>
                  {HAZARD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </section>

              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 md:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-white">תיאור חופשי</h3>

                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={5}
                  placeholder="תאר בקצרה מה קרה, מה מצב המפגע, ואם יש משהו חשוב לדעת..."
                  className="w-full resize-none rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-150 focus:border-yellow-300/70"
                />
              </section>

              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 md:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  מיקום שנלקח אוטומטית
                </h3>

                <div className="rounded-[1.1rem] border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white/80">
                  {locationText}
                </div>
              </section>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelReport}
                className="rounded-[1.1rem] border border-white/10 bg-white/8 px-5 py-3 text-sm text-white transition-all duration-150 hover:bg-white/12 active:scale-95"
              >
                ביטול
              </button>

              <button
                onClick={handleApproveReport}
                className="rounded-[1.1rem] border border-yellow-200/40 bg-yellow-400 px-5 py-3 text-sm font-semibold text-black transition-all duration-150 hover:scale-[1.02] hover:bg-yellow-300 active:scale-95"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}