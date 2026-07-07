import { useEffect } from "react";
import { isDesktopApp } from "@/lib/runtimeEnv";

export function useDesktopShell(): void {
  useEffect(() => {
    if (!isDesktopApp()) return;

    const root = document.documentElement;
    const body = document.body;
    root.classList.add("desktop");
    body.classList.add("desktop");

    return () => {
      root.classList.remove("desktop");
      body.classList.remove("desktop");
    };
  }, []);
}
