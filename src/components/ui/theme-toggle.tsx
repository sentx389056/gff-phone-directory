"use client";
import * as React from "react";

export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setDark(true);
      }
    }
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  return (
    <button
      type="button"
      aria-label="Переключить тему"
      onClick={toggle}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 20,
        padding: 4,
        marginLeft: 8,
      }}
      title={dark ? "Светлая тема" : "Тёмная тема"}
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
