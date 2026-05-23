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
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-gray-500">Schedule</p>
          {schedules.length > 0 && selectedId ? (
            <ScheduleSelect
              schedules={schedules}
              value={selectedId}
              onChange={setSelectedId}
            />
          ) : (
            <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">No schedules yet</h1>
          )}
          {selectedSchedule && (
            <p className="text-sm text-gray-500 mt-2">
              {selectedSchedule.is_default ? "Default schedule · " : ""}
              Edit weekly hours and date-specific overrides below
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
          >
            + New Schedule
          </button>
        </div>
      </div>

      {detail && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
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
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
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
                    <div key={dow} className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:border-0 sm:p-0">
                      <label className="flex w-full items-center gap-2 text-sm text-gray-700 sm:w-28">
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
                            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm sm:w-auto"
                          />
                          <span className="text-sm text-gray-400">to</span>
                          <input
                            type="time"
                            value={rule?.end_time?.slice(0, 5) || "17:00"}
                            onChange={(e) => updateRule(dow, "end_time", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm sm:w-auto"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleUpdate}
                className="mb-6 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:w-auto"
              >
                Save schedule
              </button>
            </>
          )}

          {viewMode === "calendar" && (
            <button
              onClick={handleUpdate}
              className="mt-4 w-full rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 sm:w-auto"
            >
              Save schedule
            </button>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  <div key={o.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 text-sm sm:flex-row sm:items-start sm:justify-between">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h3 className="font-semibold text-lg">Create Schedule</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            <TimezoneSelect label="Timezone" value={timezone} onChange={setTimezone} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={handleCreate} className="flex-1 rounded-lg bg-primary-600 py-2 text-white">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-300 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
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
                  <div key={i} className="flex flex-col gap-2 sm:flex-row">
                    <input type="time" value={s.start_time} onChange={(e) => { const u = [...overrideSlots]; u[i].start_time = e.target.value; setOverrideSlots(u); }} className="w-full rounded-lg border border-gray-300 px-2 py-1 sm:w-auto" />
                    <input type="time" value={s.end_time} onChange={(e) => { const u = [...overrideSlots]; u[i].end_time = e.target.value; setOverrideSlots(u); }} className="w-full rounded-lg border border-gray-300 px-2 py-1 sm:w-auto" />
                  </div>
                ))}
              </>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={handleOverride} className="flex-1 rounded-lg bg-primary-600 py-2 text-white">Add</button>
              <button onClick={() => setShowOverride(false)} className="flex-1 rounded-lg border border-gray-300 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
