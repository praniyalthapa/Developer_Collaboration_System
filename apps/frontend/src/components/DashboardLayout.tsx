import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearUser } from "../features/userSlice";
import { clearFeed } from "../features/feedSlice";
import { setRequests } from "../features/requestSlice";
import { getReceivedRequests } from "../api/user.api";
import { logout } from "../api/auth.api";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { ChatList } from "./ChatList";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";
import { NAV_ITEMS } from "./navConfig";
import { PresenceProvider } from "../context/PresenceProvider";
import { ToastProvider } from "../context/ToastProvider";
import { CallProvider } from "../context/CallProvider";

export const DashboardLayout = () => {
  const user = useAppSelector((state) => state.user);
  const pendingRequests = useAppSelector((state) => state.request?.length ?? 0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  // Load the pending-request count once on entry so the Requests badge is
  // correct app-wide, not only after visiting the Requests page.
  useEffect(() => {
    if (!user) return;
    getReceivedRequests()
      .then((data) => dispatch(setRequests(data)))
      .catch(() => undefined);
  }, [user, dispatch]);

  // Mirrors the sidebar's logout: the desktop sidebar is hidden below `lg`, so
  // without this the mobile header would leave no way to sign out.
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      dispatch(clearUser());
      dispatch(clearFeed());
      navigate("/login");
    }
  };

  return (
    <ToastProvider>
    <PresenceProvider>
    <CallProvider>
    <div className="min-h-screen lg:pl-64">
      <Sidebar />

      {/* Desktop top bar: the mobile header below is lg:hidden and the sidebar
          has no messages entry, so surface the chat/messages icon here too. */}
      <header className="glass-strong sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-base-content/10 px-10 lg:flex">
        <ChatList />
      </header>

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
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-error/10 hover:text-error"
          >
            <Icon name="logout" className="h-5 w-5" />
          </button>
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
            <span className="relative">
              <Icon name={item.icon} className="h-5 w-5" />
              {item.to === "/requests" && pendingRequests > 0 ? (
                <span className="badge badge-primary badge-xs absolute -right-2.5 -top-1.5">
                  {pendingRequests > 9 ? "9+" : pendingRequests}
                </span>
              ) : null}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
    </CallProvider>
    </PresenceProvider>
    </ToastProvider>
  );
};
