"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import CreateEventTypeDropdown from "@/components/CreateEventTypeDropdown";
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
      <h1 className="mb-5 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">Dashboard</h1>
      <div className="mb-6 grid gap-4 sm:mb-8 md:grid-cols-2 md:gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Types</h2>
          <p className="text-3xl font-bold text-primary-600">{eventTypes.length}</p>
          <Link href="/admin/event-types" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            Manage event types →
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Meetings</h2>
          <p className="text-3xl font-bold text-primary-600">{upcoming.length}</p>
          <Link href="/admin/meetings" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
            View all meetings →
          </Link>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CreateEventTypeDropdown
            label="Create Event Type"
            className="w-full sm:w-auto"
            buttonClassName="w-full rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
            menuAlign="left"
          />
          <Link href="/admin/availability" className="rounded-lg border border-primary-600 px-4 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50">
            Manage Availability
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
