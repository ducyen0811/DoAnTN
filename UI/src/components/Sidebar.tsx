import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useHealthSession } from "@/context/HealthSession";
import {
  LayoutGrid,
  HeartPulse,
  Radio,
  CloudSun,
  Sparkles,
  UserRound,
  Activity,
  X,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}
const navItems = [
  { to: "/", label: "Tổng quan", icon: LayoutGrid },
  { to: "/health-tracking", label: "Theo dõi sức khỏe", icon: HeartPulse },
  { to: "/sensors", label: "Thiết bị cảm biến", icon: Radio },
  { to: "/weather-ai", label: "Thời tiết", icon: CloudSun },
  { to: "/weather-ai#ai", label: "Gợi ý sức khỏe", icon: Sparkles },
  { to: "/profile", label: "Hồ sơ cá nhân", icon: UserRound },
];
export default function Sidebar({ open, onClose }: SidebarProps) {
  const { signOut } = useHealthSession();
  const location = useLocation();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, onClose]);
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Điều hướng chính"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-ink-900/5 bg-white px-5 py-7 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"}`}
      >
        <div className="flex items-center justify-between px-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5"
            aria-label="HealthAI - Trang tổng quan"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-700 text-white">
              <Activity size={23} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Health<span className="text-primary-700">AI</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-ink-500 hover:bg-canvas lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-3 mt-9 px-3 text-xs font-medium text-ink-500">
          Theo dõi cá nhân
        </p>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to.includes("#")
              ? location.pathname + location.hash === to
              : location.pathname === to && !(to === "/weather-ai" && location.hash === "#ai");
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${active ? "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100" : "text-ink-500 hover:bg-primary-50 hover:text-primary-700"}`}
              >
                <Icon aria-hidden="true" size={19} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mb-4 mt-8 px-3 text-xs leading-relaxed text-ink-500">
          Bản trải nghiệm · Cảm biến và thời tiết dùng dữ liệu mô phỏng.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl border-t border-ink-900/5 px-3 py-3 text-sm font-medium text-ink-500 hover:bg-canvas"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
        <p className="mt-4 px-3 text-xs text-ink-500">HealthAI · Chăm sóc sức khỏe cá nhân</p>
      </aside>
    </>
  );
}
