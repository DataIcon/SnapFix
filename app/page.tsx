"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/map/mapview";
import {
  MapPin,
  Map,
  Bell,
  Settings,
  User,
  Plus,
  X,
  Camera,
  ImagePlus,
  TriangleAlert,
} from "lucide-react";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  street: string;
};

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

export default function HomePage() {
  const [locationText, setLocationText] = useState("טוען מיקום...");
  const [currentLocation, setCurrentLocation] = useState<ResolvedLocation | null>(
    null
  );
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportImage, setReportImage] = useState<File | null>(null);

  function handleLocationResolved(data: ResolvedLocation) {
    setCurrentLocation(data);

    const parts = [data.city, data.street]
      .map((p) => p?.trim())
      .filter(Boolean);

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

  function handleApproveReport() {
    if (!reportType) {
      alert("צריך לבחור סוג מפגע");
      return;
    }

    if (!reportDescription.trim()) {
      alert("צריך לכתוב תיאור קצר");
      return;
    }

    const payload = {
      type: reportType,
      description: reportDescription.trim(),
      imageName: reportImage?.name ?? null,
      location: currentLocation,
    };

    console.log("Report payload:", payload);

    alert("הטופס מוכן. השלב הבא יהיה לחבר את זה לשמירה אמיתית.");
    resetReportForm();
    closeReportModal();
  }

  const imagePreviewText = useMemo(() => {
    if (!reportImage) return "לא נבחרה תמונה";
    return reportImage.name;
  }, [reportImage]);

  return (
    <main
      dir="rtl"
      className="relative h-screen w-full overflow-hidden bg-slate-950 text-white"
    >
      <MapView
        recenterTrigger={recenterTrigger}
        onLocationResolved={handleLocationResolved}
        onLocationError={handleLocationError}
      />

      {/* Right sidebar */}
      <aside className="absolute right-0 top-0 z-20 flex h-screen w-60 flex-col justify-between border-l border-white/10 bg-slate-950/55 px-3 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div>
          {/* Personal button */}
          <button className="mb-5 flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/12 bg-white/8 px-3 py-2 text-right transition-all duration-150 hover:bg-white/12 active:scale-95">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <User size={16} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-white">אורח</p>
            </div>
          </button>

          {/* Nav items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setRecenterTrigger((prev) => prev + 1)}
              className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <MapPin size={16} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-white">המיקום שלי</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Map size={16} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-white">תצוגת מפה</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Bell size={16} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-white">התראות</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:border-white/20 hover:bg-white/12 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Settings size={16} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-white">הגדרות</p>
              </div>
            </button>
          </nav>
        </div>

        {/* App name bottom */}
        <div className="flex justify-center pb-1">
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight text-white">SnapFix</p>
            <p className="mt-1 text-[10px] text-slate-300">דיווח מפגעים עירוני</p>
          </div>
        </div>
      </aside>

      {/* Top center location display */}
      <div className="absolute left-[calc(50%-5.5rem)] top-5 z-20 w-[min(70vw,28rem)] -translate-x-1/2 rounded-[1.3rem] border border-white/10 bg-slate-950/55 px-8 py-2 text-center shadow-[0_12px_45px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="mb-0.5 text-[10px] text-white/60">מיקום נוכחי</p>
        <p className="text-xl font-bold text-white">{locationText}</p>
      </div>

      {/* Floating Add Report Button */}
      <button
        onClick={openReportModal}
        className="absolute bottom-7 left-7 z-20 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/20 bg-yellow-400 text-black shadow-[0_14px_35px_rgba(0,0,0,0.35)] transition-all duration-150 hover:scale-105 hover:bg-yellow-300 active:scale-90"
      >
        <Plus size={26} strokeWidth={3} />
      </button>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-2xl rounded-[1.8rem] border border-white/10 bg-slate-950/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={handleCancelReport}
              className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-150 hover:bg-white/10 active:scale-95"
              aria-label="סגירת טופס"
            >
              <X size={18} />
            </button>

            <div className="mb-5 pl-12">
              <h2 className="text-2xl font-bold text-white">דיווח חדש</h2>
              <p className="mt-1 text-sm text-white/65">
                מלא את הפרטים, הוסף תמונה ושלח דיווח מהיר.
              </p>
            </div>

            <div className="space-y-4">
              {/* Image upload */}
              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <ImagePlus size={18} />
                  <h3 className="text-sm font-semibold">תמונה / מצלמה</h3>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[1.1rem] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white transition-all duration-150 hover:bg-white/12">
                    <Camera size={16} />
                    <span>צלם / העלה תמונה</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  <div className="flex min-h-[52px] flex-1 items-center rounded-[1.1rem] border border-dashed border-white/10 bg-slate-900/60 px-4 text-sm text-white/70">
                    {imagePreviewText}
                  </div>
                </div>
              </section>

              {/* Hazard type */}
              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <TriangleAlert size={18} />
                  <h3 className="text-sm font-semibold">סוג המפגע</h3>
                </div>

                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all duration-150 focus:border-yellow-300/70"
                >
                  <option value="" className="text-black">
                    בחר סוג מפגע
                  </option>
                  {HAZARD_TYPES.map((type) => (
                    <option key={type} value={type} className="text-black">
                      {type}
                    </option>
                  ))}
                </select>
              </section>

              {/* Free text */}
              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">תיאור חופשי</h3>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={5}
                  placeholder="תאר בקצרה מה קרה, מה מצב המפגע, ואם יש משהו חשוב לדעת..."
                  className="w-full resize-none rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-150 focus:border-yellow-300/70"
                />
              </section>

              {/* Auto location */}
              <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">מיקום שנלקח אוטומטית</h3>
                <div className="rounded-[1.1rem] border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white/80">
                  {locationText}
                </div>
              </section>
            </div>

            {/* Footer buttons */}
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