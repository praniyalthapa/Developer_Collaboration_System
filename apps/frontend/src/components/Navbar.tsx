import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearUser } from "../features/userSlice";
import { clearFeed } from "../features/feedSlice";
import { logout } from "../api/auth.api";
import { Avatar } from "./Avatar";
import { ChatList } from "./ChatList";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { to: "/feed", label: "Feed" },
  { to: "/connections", label: "Connections" },
  { to: "/requests", label: "Requests" },
  { to: "/sent", label: "Sent" },
];

const pillClass = ({ isActive }: { isActive: boolean }): string =>
  `nav-pill ${isActive ? "nav-pill-active" : ""}`;

export const Navbar = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = user?.role === "admin"
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin" }]
    : NAV_ITEMS;

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
    <header className="glass-strong fixed inset-x-0 top-0 z-50 border-b border-base-content/10">
      <div className="page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-glow">
            DC
          </span>
          <span className="hidden sm:inline">DevCollab</span>
        </Link>

        {user ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={pillClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <ChatList />
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                  <Avatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    photoUrl={user.photoUrl}
                    size="w-9 h-9"
                    textSize="text-sm"
                    className="ring-2 ring-primary/30"
                  />
                </div>
                <ul
                  tabIndex={0}
                  className="surface menu dropdown-content menu-sm z-[60] mt-3 w-56 p-2"
                >
                  <li className="menu-title">
                    {user.firstName} {user.lastName}
                  </li>
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                  <li>
                    <Link to="/connections">Connections</Link>
                  </li>
                  {user.role === "admin" ? (
                    <li>
                      <Link to="/admin">Admin dashboard</Link>
                    </li>
                  ) : null}
                  <li>
                    <button type="button" className="text-error" onClick={handleLogout}>
                      Log out
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-circle md:hidden"
                aria-label="Open menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-brand btn-sm px-5">
              Log in
            </Link>
          )}
        </div>
      </div>

      {user && menuOpen ? (
        <nav className="border-t border-base-content/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={pillClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
};
