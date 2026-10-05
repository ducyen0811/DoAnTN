import { useCallback, useState } from "react";
import { Navigate, Outlet, useMatches } from "react-router-dom";
import { useHealthSession } from "@/context/HealthSession";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface RouteHandle {
  title: string;
  subtitle: string;
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const matches = useMatches();
  const { signedIn } = useHealthSession();
  const current = matches[matches.length - 1]?.handle as RouteHandle | undefined;

  if (!signedIn) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen bg-canvas">
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      <Sidebar open={menuOpen} onClose={closeMenu} />

      <div className="mx-auto min-w-0 max-w-[1600px] flex-1 pb-12">
        <Header
          title={current?.title ?? "Dashboard"}
          subtitle={current?.subtitle ?? ""}
          onMenuClick={openMenu}
        />
        <main id="main-content" tabIndex={-1} className="px-4 pt-6 sm:px-7 lg:px-9 lg:pt-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
