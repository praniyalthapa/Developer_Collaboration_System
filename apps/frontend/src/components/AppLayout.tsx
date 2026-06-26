import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const AppLayout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="page w-full flex-1 pb-16 pt-24">
      <Outlet />
    </main>
    <Footer />
  </div>
);
