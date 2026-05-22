"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, EventTypeListItem, MeetingItem } from "@/lib/api";

export default function DashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeListItem[]>([]);
  const [upcoming, setUpcoming] = useState<MeetingItem[]>([]);

  useEffect(() => {
    api.getEventTypes().then((r) => setEventTypes(r.event_types)).catch(() => {});
    api.getMeetings("upcoming").then((r) => setUpcoming(r.meetings.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Types</h2>
          <p className="text-3xl font-bold text-primary-600">{eventTypes.length}</p>
          <Link href="/admin/event-types" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            Manage event types →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Meetings</h2>
          <p className="text-3xl font-bold text-primary-600">{upcoming.length}</p>
          <Link href="/admin/meetings" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            View all meetings →
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/event-types/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Create Event Type
          </Link>
          <Link href="/admin/availability" className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50">
            Manage Availability
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
