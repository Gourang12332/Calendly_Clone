"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ScheduleCalendarView from "@/components/ScheduleCalendarView";
import ScheduleSelect from "@/components/ScheduleSelect";
import TimezoneSelect from "@/components/TimezoneSelect";
import { api, ScheduleListItem, ScheduleDetail } from "@/lib/api";
import { getBrowserTimezone } from "@/lib/timezones";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScheduleDetail | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [showCreate, setShowCreate] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [name, setName] = useState("New Schedule");
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [rules, setRules] = useState(
    [1, 2, 3, 4, 5].map((d) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00", is_active: true }))
  );
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideUnavailable, setOverrideUnavailable] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSlots, setOverrideSlots] = useState([{ start_time: "14:00", end_time: "18:00" }]);

  const loadSchedules = () => {
    api.getSchedules().then((r) => {
      setSchedules(r.schedules);
      if (r.schedules.length === 0) {
        setSelectedId(null);
        return;
      }
      if (!selectedId || !r.schedules.some((s) => s.id === selectedId)) {
        const def = r.schedules.find((s) => s.is_default) || r.schedules[0];
        setSelectedId(def.id);
      }
    });
  };

  const refreshDetail = () => {
    if (selectedId) {
      api.getSchedule(selectedId).then(setDetail);
    }
  };

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  useEffect(() => {
    if (selectedId) {
      api.getSchedule(selectedId).then(setDetail);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const handleCreate = async () => {
    await api.createSchedule({ name, timezone, is_default: schedules.length === 0, rules });
    setShowCreate(false);
    loadSchedules();
  };

  const handleUpdate = async () => {
    if (!selectedId || !detail) return;
    await api.updateSchedule(selectedId, {
      name: detail.name,
      timezone: detail.timezone,
      is_default: detail.is_default,
      rules: detail.rules.map((r) => ({
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        is_active: r.is_active,
      })),
    });
    refreshDetail();
    loadSchedules();
    alert("Schedule updated");
  };

  const handleOverride = async () => {
    if (!selectedId || !overrideDate) return;
    await api.addOverride(selectedId, {
      override_date: overrideDate,
      is_unavailable: overrideUnavailable,
      reason: overrideReason,
      slots: overrideUnavailable ? [] : overrideSlots,
    });
    setShowOverride(false);
    refreshDetail();
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!selectedId) return;
    if (!confirm("Delete this date override?")) return;
    await api.deleteOverride(selectedId, overrideId);
    refreshDetail();
  };

  const updateRule = (dow: number, field: string, value: string | boolean) => {
    if (!detail) return;
    const existing = detail.rules.find((r) => r.day_of_week === dow);
    if (existing) {
      setDetail({
        ...detail,
        rules: detail.rules.map((r) =>
          r.day_of_week === dow ? { ...r, [field]: value } : r
        ),
      });
    } else {
      setDetail({
        ...detail,
        rules: [
          ...detail.rules,
          { id: "", day_of_week: dow, start_time: "09:00", end_time: "17:00", is_active: true, [field]: value } as ScheduleDetail["rules"][0],
        ],
      });
    }
  };

  const selectedSchedule = schedules.find((s) => s.id === selectedId);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Schedule</p>
          {schedules.length > 0 && selectedId ? (
            <ScheduleSelect
              schedules={schedules}
              value={selectedId}
              onChange={setSelectedId}
            />
          ) : (
            <h1 className="text-xl font-semibold text-gray-900">No schedules yet</h1>
          )}
          {selectedSchedule && (
            <p className="text-sm text-gray-500 mt-2">
              {selectedSchedule.is_default ? "Default schedule · " : ""}
              Edit weekly hours and date-specific overrides below
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            + New Schedule
          </button>
        </div>
      </div>

      {detail && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Calendar
              </button>
            </div>
            <TimezoneSelect
              label="Schedule timezone"
              value={detail.timezone}
              onChange={(tz) => setDetail({ ...detail, timezone: tz })}
              compact
            />
          </div>

          {viewMode === "calendar" ? (
            <ScheduleCalendarView
              detail={detail}
              onDeleteOverride={handleDeleteOverride}
            />
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {DAY_LABELS.map((label, dow) => {
                  const rule = detail.rules.find((r) => r.day_of_week === dow);
                  const active = rule?.is_active ?? false;
                  return (
                    <div key={dow} className="flex items-center gap-4 flex-wrap">
                      <label className="w-28 text-sm text-gray-700 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => updateRule(dow, "is_active", e.target.checked)}
                        />
                        {label}
                      </label>
                      {active && (
                        <>
                          <input
                            type="time"
                            value={rule?.start_time?.slice(0, 5) || "09:00"}
                            onChange={(e) => updateRule(dow, "start_time", e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={rule?.end_time?.slice(0, 5) || "17:00"}
                            onChange={(e) => updateRule(dow, "end_time", e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 mb-6"
              >
                Save schedule
              </button>
            </>
          )}

          {viewMode === "calendar" && (
            <button
              onClick={handleUpdate}
              className="mt-4 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
            >
              Save schedule
            </button>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Date Overrides</h3>
              <button onClick={() => setShowOverride(true)} className="text-sm text-primary-600 font-medium">
                + Add Override
              </button>
            </div>
            {detail.overrides.length === 0 ? (
              <p className="text-sm text-gray-500">No date overrides</p>
            ) : (
              <div className="space-y-2">
                {detail.overrides.map((o) => (
                  <div key={o.id} className="text-sm border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{o.override_date}</p>
                      <p className="text-gray-500">
                        {o.is_unavailable
                          ? "Unavailable"
                          : o.slots.map((s) => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`).join(", ")}
                      </p>
                      {o.reason && <p className="text-gray-400 text-xs">{o.reason}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteOverride(o.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg">Create Schedule</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            <TimezoneSelect label="Timezone" value={timezone} onChange={setTimezone} />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showOverride && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg">Date Override</h3>
            <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={overrideUnavailable} onChange={(e) => setOverrideUnavailable(e.target.checked)} />
              Mark as unavailable
            </label>
            {!overrideUnavailable && (
              <>
                <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                {overrideSlots.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="time" value={s.start_time} onChange={(e) => { const u = [...overrideSlots]; u[i].start_time = e.target.value; setOverrideSlots(u); }} className="border border-gray-300 rounded-lg px-2 py-1" />
                    <input type="time" value={s.end_time} onChange={(e) => { const u = [...overrideSlots]; u[i].end_time = e.target.value; setOverrideSlots(u); }} className="border border-gray-300 rounded-lg px-2 py-1" />
                  </div>
                ))}
              </>
            )}
            <div className="flex gap-2">
              <button onClick={handleOverride} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Add</button>
              <button onClick={() => setShowOverride(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
