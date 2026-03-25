import MapView from "@/components/map/mapview";
import {
  MapPin,
  Map,
  Bell,
  Settings,
  User,
  Plus,
} from "lucide-react";

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="relative h-screen w-full overflow-hidden bg-slate-950 text-white"
    >
      <MapView />

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
            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:bg-white/12 hover:border-white/20 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">המיקום שלי</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:bg-white/12 hover:border-white/20 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Map size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">תצוגת מפה</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:bg-white/12 hover:border-white/20 active:scale-95">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">התראות</p>
              </div>
            </button>

            <button className="flex w-full items-center gap-2.5 rounded-[1.3rem] border border-white/10 bg-white/6 px-3 py-2 text-right transition-all duration-150 hover:bg-white/12 hover:border-white/20 active:scale-95">
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
            <p className="text-lg font-bold tracking-tight text-white">
              SnapFix
            </p>
            <p className="mt-1 text-[10px] text-slate-300">
              דיווח מפגעים עירוני
            </p>
          </div>
        </div>
      </aside>

      {/* Top center location display */}
      <div className="absolute left-[calc(50%-5.5rem)] top-5 z-20 w-[min(70vw,28rem)] -translate-x-1/2 rounded-[1.3rem] border border-white/10 bg-slate-950/55 px-8 py-2 text-center shadow-[0_12px_45px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="mb-0.5 text-[10px] text-white/60">מיקום נוכחי</p>
        <p className="text-xl font-bold text-white">עיר, רחוב</p>
      </div>

      {/* Floating Add Report Button */}
      <button className="absolute bottom-7 left-7 z-20 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/20 bg-yellow-400 text-black shadow-[0_14px_35px_rgba(0,0,0,0.35)] transition-all duration-150 hover:scale-105 active:scale-90 hover:bg-yellow-300">
        <Plus size={26} strokeWidth={3} />
      </button>
    </main>
  );
}