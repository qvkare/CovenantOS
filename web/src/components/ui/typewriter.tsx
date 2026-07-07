"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function Typewriter({
  text,
  speed = 50,
  deleteSpeed = 30,
  waitTime = 2000,
  className,
  cursorChar = "▋",
  cursorClassName,
}: {
  text: string[];
  speed?: number;
  deleteSpeed?: number;
  waitTime?: number;
  className?: string;
  cursorChar?: string;
  cursorClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = text[index] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && display.length < current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, display.length + 1));
      }, speed);
    } else if (!deleting && display.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), waitTime);
    } else if (deleting && display.length > 0) {
      timeout = setTimeout(() => {
        setDisplay(display.slice(0, -1));
      }, deleteSpeed);
    } else if (deleting && display.length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % text.length);
    }

    return () => clearTimeout(timeout);
  }, [display, deleting, index, text, speed, deleteSpeed, waitTime]);

  return (
    <span className={className}>
      {display}
      <span className={cn("ml-0.5 animate-pulse", cursorClassName)}>
        {cursorChar}
      </span>
    </span>
  );
}
