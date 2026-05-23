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
          className={`absolute ${alignClass} top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-lg border border-[#d7e3ef] bg-white text-left shadow-xl sm:w-[430px] lg:max-w-[520px] lg:w-[520px]`}
        >
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <p className="mb-5 text-base font-bold text-[#46658a] sm:text-lg">
              Event type
            </p>

            <div className="space-y-6">
              {eventTypeOptions.map((option) => (
                <Link
                  key={option.title}
                  href={createEventTypeHref}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  role="menuitem"
                >
                  <div className="px-1 py-1">
                    <h3 className="text-base font-bold text-blue-700 sm:text-lg">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-base text-[#0b2545] sm:text-lg">
                      {option.line}
                    </p>
                    <p className="mt-1 text-sm text-[#506b8b] sm:text-base">
                      {option.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-[#d7e3ef] px-5 py-5 sm:px-7 sm:py-6">
            <p className="mb-5 text-base font-bold text-[#46658a] sm:text-lg">
              More ways to meet
            </p>

            <div className="space-y-5">
              {moreWaysOptions.map((option) => (
                <Link
                  key={option.title}
                  href={createEventTypeHref}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  role="menuitem"
                >
                  <div className="px-1 py-1">
                    <h3 className="text-base font-bold text-blue-700 sm:text-lg">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#506b8b] sm:text-base">
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
