"use client";

import { ScheduleListItem } from "@/lib/api";

interface ScheduleSelectProps {
  schedules: ScheduleListItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function ScheduleSelect({
  schedules,
  value,
  onChange,
  className = "",
}: ScheduleSelectProps) {
  if (schedules.length === 0) {
    return <p className="text-sm text-gray-500">No schedules yet</p>;
  }

  return (
    <div className={`relative inline-flex items-center max-w-full ${className}`}>
      <label className="sr-only">Select schedule</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer text-sm font-semibold text-primary-700 bg-transparent border-0 pr-8 pl-0 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md max-w-full truncate"
      >
        {schedules.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.is_default ? " (default)" : ""}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-primary-600"
        aria-hidden
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  );
}
