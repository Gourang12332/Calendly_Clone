"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, EventTypeListItem } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const router = useRouter();

  const load = () => {
    setLoading(true);
    api
      .getEventTypes()
      .then((r) => setEventTypes(r.event_types))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event type?")) return;
    await api.deleteEventType(id);
    load();
  };

  return (
    <AdminLayout>
      
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-200 px-8 py-8">
          <div className="mb-6 rounded-md border border-blue-500 bg-blue-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#0b2545]">
                  Review our updated Terms of Use
                </p>
                <p className="text-sm text-[#0b2545]">
                  We&apos;ve updated our Terms of Use to reflect how Calendly
                  works today.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="text-sm font-semibold text-[#0b2545]">
                  Review terms
                </button>
                <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
                  Accept terms
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0b2545]">Scheduling</h1>

            <Link
              href="/admin/event-types/new"
              className="rounded-full bg-blue-600 px-7 py-2 font-semibold text-white hover:bg-blue-700"
            >
              + Create
            </Link>
          </div>

          <div className="mt-8 flex gap-8 text-sm font-semibold text-gray-500">
            <button className="border-b-2 border-blue-600 pb-4 text-[#0b2545]">
              Event types
            </button>
            <button className="pb-4">Single-use links</button>
            <button className="pb-4">Meeting polls</button>
          </div>
        </div>

        <div className="px-8 py-5">
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search event types"
              className="h-12 w-full max-w-md rounded-md border border-[#9db4cc] px-4 outline-none focus:border-blue-600"
            />
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : eventTypes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <p className="mb-4 text-gray-500">No event types yet</p>
              <Link
                href="/admin/event-types/new"
                className="font-medium text-blue-600 hover:underline"
              >
                Create your first event type
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {eventTypes.map((et) => (
                <div onClick={() => router.push(`/admin/event-types/${et.id}/edit`)}
                  key={et.id}
                  className={`relative overflow-hidden rounded-lg bg-white shadow-sm transition-all
before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-purple-600
hover:bg-blue-50 hover:!border-red-500`}
                >
                  <div className="flex items-center justify-between px-5 py-2">
                    <div className="flex items-start gap-4">
                      <input type="checkbox" className="mt-1 h-4 w-4" />

                      <div>
                        <h3 className="text-lg font-bold text-[#0b2545]">
                          {et.name}
                        </h3>

                        <p className="mt-1 text-sm text-[#46658a]">
                          {et.duration_minutes} min
                          {et.location_type ? ` • ${et.location_type}` : ""}
                          {et.event_kind ? ` • ${et.event_kind}` : ""}
                        </p>

                        <p className="mt-1 text-sm text-[#46658a]">
                          {et.availability_summary || "Availability varies"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyLink(et.slug)}
                        className="rounded-full border border-[#0b2545] px-4 py-2 text-sm font-semibold text-[#0b2545] hover:bg-gray-50"
                      >
                        {copied === et.slug ? "Copied!" : "Copy link"}
                      </button>

                      <Link
                        href={`/book/${et.slug}`}
                        target="_blank"
                        className="text-xl text-[#0b2545]"
                      >
                        ↗
                      </Link>

                      <Link
                        href={`/admin/event-types/${et.id}/edit`}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-[#0b2545] hover:bg-gray-100"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(et.id)}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
