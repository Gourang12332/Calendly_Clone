"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CreateEventTypeDropdownProps = {
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuAlign?: "left" | "right";
};

const createEventTypeHref = "/admin/event-types/new";

const eventTypeOptions = [
  {
    title: "One-on-one",
    line: "1 host → 1 invitee",
    description: "Good for coffee chats, 1:1 interviews, etc.",
  },
  {
    title: "Group",
    line: "1 host → Multiple invitees",
    description: "Webinars, online classes, etc.",
  },
  {
    title: "Round robin",
    line: "Rotating hosts → 1 invitee",
    description: "Distribute meetings between team members",
  },
  {
    title: "Collective",
    line: "Multiple hosts → 1 invitee",
    description: "Panel interviews, group sales calls, etc.",
  },
];

const moreWaysOptions = [
  {
    title: "One-off meeting",
    description: "Offer time outside your normal schedule",
  },
  {
    title: "Meeting poll",
    description: "Let invitees vote on a time to meet",
  },
];

export default function CreateEventTypeDropdown({
  label = "+ Create",
  className = "",
  buttonClassName = "w-full rounded-full bg-blue-600 px-7 py-2 text-center font-semibold text-white hover:bg-blue-700 sm:w-auto",
  menuAlign = "right",
}: CreateEventTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const alignClass = menuAlign === "left" ? "left-0" : "right-0";

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={buttonClassName}
      >
        {label}
      </button>

      {open && (
        <div
        role="menu"
        className={`absolute ${alignClass} top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-lg border border-[#d7e3ef] bg-white text-left shadow-xl sm:w-[430px] lg:max-w-[500px] lg:w-[500px]`}
      >
        <div className="px-4 py-4 sm:px-5 sm:py-4">
          <p className="mb-3 text-sm font-bold text-[#46658a]">
            Event type
          </p>

          <div className="space-y-3">
            {eventTypeOptions.map((option) => (
              <Link
                key={option.title}
                href={createEventTypeHref}
                onClick={() => setOpen(false)}
                className="block rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                role="menuitem"
              >
                <div className="px-1 py-0.5">
                  <h3 className="text-sm font-bold text-blue-700">
                    {option.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[#0b2545]">
                    {option.line}
                  </p>
                  <p className="mt-0.5 text-xs text-[#506b8b]">
                    {option.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-[#d7e3ef] px-4 py-4 sm:px-5 sm:py-4">
          <p className="mb-3 text-sm font-bold text-[#46658a]">
            More ways to meet
          </p>

          <div className="space-y-3">
            {moreWaysOptions.map((option) => (
              <Link
                key={option.title}
                href={createEventTypeHref}
                onClick={() => setOpen(false)}
                className="block rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                role="menuitem"
              >
                <div className="px-1 py-0.5">
                  <h3 className="text-sm font-bold text-blue-700">
                    {option.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#506b8b]">
                    {option.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
