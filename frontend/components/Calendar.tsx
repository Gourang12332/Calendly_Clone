"use client";

import { useState } from "react";
import { DAY_NAMES, MONTH_NAMES, getDaysInMonth, getFirstDayOfMonth, toDateString } from "@/lib/utils";

interface CalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  minDate?: Date;
}

export default function Calendar({ selectedDate, onSelectDate, minDate }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const min = minDate || today;

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

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-10" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day);
    const dateStr = toDateString(d);
    const isPast = dateStr < toDateString(min);
    const isSelected = selectedDate === dateStr;
    const isToday = toDateString(today) === dateStr;

    cells.push(
      <button
        key={day}
        type="button"
        disabled={isPast}
        onClick={() => onSelectDate(dateStr)}
        className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
          isSelected
            ? "bg-primary-600 text-white"
            : isToday
            ? "bg-primary-100 text-primary-700"
            : isPast
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-primary-50"
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-2 text-gray-500 hover:text-primary-600">
          ‹
        </button>
        <h3 className="font-semibold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button type="button" onClick={nextMonth} className="p-2 text-gray-500 hover:text-primary-600">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}
