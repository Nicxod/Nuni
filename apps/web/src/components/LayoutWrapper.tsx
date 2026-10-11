"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [currentRole, setCurrentRole] = useState("farmer");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onRefresh={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-3.5 sm:p-6 pb-22 md:pb-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
