"use client";

import { TIMEZONE_OPTIONS, getTimezoneLabel } from "@/lib/timezones";

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export default function TimezoneSelect({
  value,
  onChange,
  label,
  compact = false,
  className = "",
}: TimezoneSelectProps) {
  const inList = TIMEZONE_OPTIONS.some((o) => o.value === value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          compact
            ? "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 sm:min-w-[200px]"
            : "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
        }
      >
        {!inList && value && (
          <option value={value}>{getTimezoneLabel(value)}</option>
        )}
        {TIMEZONE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
