"use client";

import { useEffect } from "react";
import { installMockFetch } from "@/lib/mock/install";

export function MockBootstrap() {
  useEffect(() => {
    installMockFetch();
  }, []);
  return null;
}
