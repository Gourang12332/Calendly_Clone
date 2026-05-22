"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, TokenBooking } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function CancelPage() {
  const params = useParams();
  const token = params.token as string;
  const [booking, setBooking] = useState<TokenBooking | null>(null);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBookingByToken(token).then(setBooking).catch(() => setError("Invalid or expired link"));
  }, [token]);

  const handleCancel = async () => {
    try {
      await api.cancelByToken(token, reason);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
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

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Cancelled</h1>
          <p className="text-gray-500">Your meeting has been successfully cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Cancel Meeting</h1>
        <p className="text-gray-500 text-center mb-6">Are you sure you want to cancel this meeting?</p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 space-y-2">
          <h2 className="font-semibold">{booking.event_name}</h2>
          <p className="text-sm text-gray-600">{booking.invitee_name}</p>
          <p className="text-sm text-gray-700">{formatDateTime(booking.start_time, booking.timezone)}</p>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
          rows={3}
        />
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleCancel} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
