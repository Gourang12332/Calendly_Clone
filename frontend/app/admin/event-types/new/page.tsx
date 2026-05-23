"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { api, ScheduleListItem } from "@/lib/api";
import { slugify } from "@/lib/utils";

export default function NewEventTypePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [scheduleId, setScheduleId] = useState("");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [locationType, setLocationType] = useState("online");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSchedules().then((r) => {
      setSchedules(r.schedules);
      const def = r.schedules.find((s) => s.is_default);
      if (def) setScheduleId(def.id);
    });
  }, []);

  useEffect(() => {
    if (name) setSlug(slugify(name));
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.createEventType({
        name,
        slug,
        description,
        duration_minutes: duration,
        schedule_id: scheduleId || undefined,
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
        location_type: locationType,
      });
      router.push(`/admin/event-types/${res.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="mb-5 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">New Event Type</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability Schedule</label>
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="">Default</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Before (min)</label>
            <input type="number" min={0} value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buffer After (min)</label>
            <input type="number" min={0} value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
          <select value={locationType} onChange={(e) => setLocationType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="online">Online</option>
            <option value="phone">Phone</option>
            <option value="in_person">In Person</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {saving ? "Creating..." : "Create Event Type"}
        </button>
      </form>
    </AdminLayout>
  );
}
