import { Menu, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { useHealthSession } from "@/context/HealthSession";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { data } = useHealthSession();
  const initials = data?.profile.fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("");
  return (
    <header className="flex items-center justify-between gap-3 border-b border-ink-900/5 bg-white/80 px-4 py-5 sm:px-7 lg:px-9">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-ink-900/10 bg-white p-2 text-ink-500 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu size={21} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-xs leading-relaxed text-ink-500 sm:text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="hidden items-center gap-2 rounded-xl border border-ink-900/5 bg-white px-3 py-2.5 text-xs font-medium text-ink-500 xl:flex">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        <Link
          to="/profile"
          aria-label="Xem hồ sơ cá nhân"
          className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-canvas"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
            {initials}
          </span>
          <span className="hidden max-w-36 sm:block">
            <span className="block truncate text-xs font-semibold">{data?.profile.fullName}</span>
            <span className="mt-0.5 block text-xs text-ink-500">Hồ sơ cá nhân</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
