import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { MobileDrawer } from "./MobileDrawer";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      <Header />
      <MobileDrawer />
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
