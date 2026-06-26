import { Link, NavLink, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { ChatList } from "./ChatList";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";
import { NAV_ITEMS } from "./navConfig";
import { PresenceProvider } from "../context/PresenceProvider";

export const DashboardLayout = () => {
  const user = useAppSelector((state) => state.user);
  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <PresenceProvider>
    <div className="min-h-screen lg:pl-64">
      <Sidebar />

      <header className="glass-strong sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-content/10 px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
            DC
          </span>
          DevCollab
        </Link>
        <div className="flex items-center gap-1">
          <ChatList />
          <ThemeToggle />
          <Link to="/profile">
            <Avatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              photoUrl={user?.photoUrl}
              size="w-9 h-9"
              className="ring-2 ring-primary/25"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-10 lg:pt-12 lg:pb-12">
        <Outlet />
      </main>

      <nav className="glass-strong fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-base-content/10 px-2 py-2 lg:hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-base-content/55"
              }`
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
    </PresenceProvider>
  );
};
