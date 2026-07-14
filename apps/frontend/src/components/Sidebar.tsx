import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearUser } from "../features/userSlice";
import { clearFeed } from "../features/feedSlice";
import { logout } from "../api/auth.api";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./icons";
import { NAV_ITEMS } from "./navConfig";

export const Sidebar = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const pendingRequests = useAppSelector((state) => state.request?.length ?? 0);

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

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
    <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-base-content/10 p-4 lg:flex">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2 text-lg font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-glow">
          DC
        </span>
        DevCollab
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-base-content/40">
          Menu
        </p>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/12 text-primary"
                  : "text-base-content/65 hover:bg-base-content/5 hover:text-base-content"
              }`
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
            {item.to === "/requests" && pendingRequests > 0 ? (
              <span className="badge badge-primary badge-sm ml-auto">
                {pendingRequests > 9 ? "9+" : pendingRequests}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-base-content/10 bg-base-100/40 p-2">
          <Link to="/profile" className="flex min-w-0 items-center gap-2.5">
            <Avatar
              firstName={user?.firstName}
              lastName={user?.lastName}
              photoUrl={user?.photoUrl}
              size="w-9 h-9"
              textSize="text-xs"
              className="ring-2 ring-primary/25"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-base-content/45">
                {user?.role}
              </p>
            </div>
          </Link>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-base-content/65 transition-colors hover:bg-error/10 hover:text-error"
        >
          <Icon name="logout" className="h-5 w-5" />
          Log out
        </button>
      </div>
    </aside>
  );
};
