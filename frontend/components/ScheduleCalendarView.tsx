"use client";

import { useState } from "react";
import { ScheduleDetail } from "@/lib/api";
import { getTimezoneLabel } from "@/lib/timezones";
import {
  DAY_NAMES,
  MONTH_NAMES,
  getDaysInMonth,
  getFirstDayOfMonth,
  toDateString,
} from "@/lib/utils";

function formatTime12(timeStr: string) {
  const [h, m] = timeStr.split(":").map((x) => parseInt(x, 10));
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  const mins = m ? `:${String(m).padStart(2, "0")}` : "";
  return `${hour12}${mins}${period}`;
}

function formatRange(start: string, end: string) {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}

interface ScheduleCalendarViewProps {
  detail: ScheduleDetail;
  onDeleteOverride?: (overrideId: string) => void;
}

export default function ScheduleCalendarView({
  detail,
  onDeleteOverride,
}: ScheduleCalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const getCellInfo = (day: number) => {
    const dateStr = toDateString(new Date(viewYear, viewMonth, day));
    const override = detail.overrides.find((o) => o.override_date === dateStr);

    if (override) {
      if (override.is_unavailable) {
        return {
          dateStr,
          lines: ["Unavailable"],
          isOverride: true,
          isRecurring: false,
          overrideId: override.id,
        };
      }
      const lines =
        override.slots.length > 0
          ? override.slots.map((s) => formatRange(s.start_time, s.end_time))
          : ["Custom hours"];
      return {
        dateStr,
        lines,
        isOverride: true,
        isRecurring: false,
        overrideId: override.id,
      };
    }

    const dow = new Date(viewYear, viewMonth, day).getDay();
    const rule = detail.rules.find((r) => r.day_of_week === dow && r.is_active);
    if (!rule) {
      return { dateStr, lines: [] as string[], isOverride: false, isRecurring: false };
    }
    return {
      dateStr,
      lines: [formatRange(rule.start_time, rule.end_time)],
      isOverride: false,
      isRecurring: true,
    };
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(viewYear, viewMonth, -firstDay + i + 1);
    cells.push(
      <div
        key={`prev-${i}`}
        className="min-h-[88px] border border-gray-100 bg-gray-50/80 p-2 text-gray-300"
      >
        <span className="text-sm">{prevDate.getDate()}</span>
      </div>
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const info = getCellInfo(day);
    const isToday = toDateString(today) === info.dateStr;

    cells.push(
      <div
        key={day}
        className={`min-h-[88px] border border-gray-200 p-2 relative ${
          info.isOverride ? "bg-amber-50/60" : "bg-white"
        }`}
      >
        <div className="flex items-start justify-between">
          <span
            className={`text-sm font-medium ${
              isToday ? "text-primary-600" : "text-gray-700"
            }`}
          >
            {day}
          </span>
          {info.isRecurring && (
            <span className="text-gray-400" title="Weekly recurring hours">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
            </span>
          )}
          {info.isOverride && onDeleteOverride && info.overrideId && (
            <button
              type="button"
              onClick={() => onDeleteOverride(info.overrideId!)}
              className="text-[10px] text-red-600 hover:underline"
              title="Delete override"
            >
              Delete
            </button>
          )}
        </div>
        <div className="mt-2 space-y-0.5">
          {info.lines.map((line, idx) => (
            <p key={idx} className="text-xs text-gray-600 leading-tight">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const totalCells = firstDay + daysInMonth;
  const trailing = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= trailing; i++) {
    cells.push(
      <div
        key={`next-${i}`}
        className="min-h-[88px] border border-gray-100 bg-gray-50/80 p-2 text-gray-300"
      >
        <span className="text-sm">{i}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-50"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-50"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-3">{getTimezoneLabel(detail.timezone)}</p>

      <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="bg-gray-50 border-b border-gray-200 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
        {cells}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          Weekly hours
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
          Date override
        </span>
      </div>
    </div>
  );
}
