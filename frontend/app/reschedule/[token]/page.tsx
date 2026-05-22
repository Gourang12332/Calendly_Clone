"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";
import TimezoneSelect from "@/components/TimezoneSelect";
import { api, TokenBooking, Slot } from "@/lib/api";
import { getBrowserTimezone } from "@/lib/timezones";
import { formatTime } from "@/lib/utils";

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [booking, setBooking] = useState<TokenBooking | null>(null);
  const [slug, setSlug] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [displayTimezone, setDisplayTimezone] = useState(getBrowserTimezone());

  useEffect(() => {
    api.getBookingByToken(token).then((b) => {
      setBooking(b);
      if (b.event_slug) setSlug(b.event_slug);
      setDisplayTimezone(b.timezone || getBrowserTimezone());
    }).catch(() => setError("Invalid or expired link"));
  }, [token]);

  useEffect(() => {
    if (selectedDate && slug) {
      api.getSlots(slug, selectedDate).then((r) => setSlots(r.slots));
    }
  }, [selectedDate, slug]);

  const handleReschedule = async () => {
    if (!selectedSlot || !booking) return;
    setSubmitting(true);
    try {
      const res = await api.rescheduleByToken(token, {
        new_start_time: selectedSlot.start_time,
        timezone: displayTimezone,
      });
      router.push(`/booking-confirmed/${res.new_booking_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reschedule Meeting</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-center">
          <p className="font-medium">{booking.event_name}</p>
          <p className="text-sm text-gray-500">Current: {formatTime(booking.start_time, displayTimezone)}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="flex-1 max-w-xs w-full">
            <div className="flex flex-col gap-3 mb-3">
              <h2 className="font-semibold">Select new time</h2>
              <TimezoneSelect value={displayTimezone} onChange={setDisplayTimezone} compact />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start_time}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-2 ${
                    selectedSlot?.start_time === slot.start_time
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "border-primary-600 text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  {formatTime(slot.start_time, displayTimezone)}
                </button>
              ))}
            </div>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
            {selectedSlot && (
              <button
                onClick={handleReschedule}
                disabled={submitting}
                className="w-full mt-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
