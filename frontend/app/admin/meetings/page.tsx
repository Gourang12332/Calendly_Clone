"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, MeetingItem } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function MeetingsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const load = () => {
    setLoading(true);
    api.getMeetings(tab).then((r) => setMeetings(r.meetings)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    await api.cancelMeeting(id, cancelReason);
    setActionId(null);
    setCancelReason("");
    load();
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleTime) return;
    await api.rescheduleMeeting(id, { new_start_time: new Date(rescheduleTime).toISOString(), timezone: "Asia/Kolkata" });
    setActionId(null);
    setRescheduleTime("");
    load();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meetings</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "upcoming" ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "past" ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
        >
          Past
        </button>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">No {tab} meetings</div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{m.event_name}</h3>
                <p className="text-sm text-gray-600">{m.invitee_name} · {m.invitee_email}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDateTime(m.start_time)}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                  m.status === "scheduled" ? "bg-green-100 text-green-700" :
                  m.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{m.status}</span>
              </div>
              {tab === "upcoming" && m.status === "scheduled" && (
                <div className="flex gap-2">
                  <button onClick={() => setActionId(m.id + "-cancel")} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Cancel</button>
                  <button onClick={() => setActionId(m.id + "-reschedule")} className="px-3 py-1.5 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50">Reschedule</button>
                </div>
              )}
              {actionId === m.id + "-cancel" && (
                <div className="w-full md:w-auto space-y-2">
                  <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
                  <div className="flex gap-2">
                    <button onClick={() => handleCancel(m.id)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg">Confirm</button>
                    <button onClick={() => setActionId(null)} className="px-3 py-1.5 text-sm border rounded-lg">Back</button>
                  </div>
                </div>
              )}
              {actionId === m.id + "-reschedule" && (
                <div className="w-full md:w-auto space-y-2">
                  <input type="datetime-local" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
                  <div className="flex gap-2">
                    <button onClick={() => handleReschedule(m.id)} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg">Confirm</button>
                    <button onClick={() => setActionId(null)} className="px-3 py-1.5 text-sm border rounded-lg">Back</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
