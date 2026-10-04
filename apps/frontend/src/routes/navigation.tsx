import type { ReactNode } from "react";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export interface NavigationItem {
  label: string;
  path: string;
  element: ReactNode;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    element: <DashboardPage />,
  },
];
