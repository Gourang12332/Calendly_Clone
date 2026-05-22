"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, BookingConfirmation } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function BookingConfirmedPage() {
  const params = useParams();
  const id = params.id as string;
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    api.getBooking(id).then(setBooking).catch(() => {});
  }, [id]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-green-600">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You are scheduled!</h1>
        <p className="text-gray-500 mb-8">A calendar invitation has been sent to your email address.</p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-left shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900 text-lg">{booking.event_name}</h2>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{booking.invitee_name}</span> · {booking.invitee_email}
          </p>
          <p className="text-sm text-gray-700">{formatDateTime(booking.start_time, booking.timezone)}</p>
          <p className="text-sm text-gray-500">Timezone: {booking.timezone}</p>
          {booking.meeting_url && (
            <a href={booking.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-primary-600 hover:underline">
              Join Meeting →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
