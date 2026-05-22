"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Calendar from "@/components/Calendar";
import TimezoneSelect from "@/components/TimezoneSelect";
import { api, PublicEventType, Slot } from "@/lib/api";
import { getBrowserTimezone, getTimezoneLabel } from "@/lib/timezones";
import { formatTime } from "@/lib/utils";

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<PublicEventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<"calendar" | "form">("calendar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [displayTimezone, setDisplayTimezone] = useState(getBrowserTimezone());

  useEffect(() => {
    api
      .getPublicEvent(slug)
      .then((ev) => {
        setEvent(ev);
        setDisplayTimezone(getBrowserTimezone());
      })
      .catch(() => setError("Event not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (selectedDate && event) {
      api
        .getSlots(slug, selectedDate)
        .then((r) => setSlots(r.slots))
        .catch(() => setSlots([]));

      setSelectedSlot(null);
    }
  }, [selectedDate, slug, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event || !selectedSlot) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await api.createBooking({
        event_type_id: event.id,
        invitee_name: name,
        invitee_email: email,
        start_time: selectedSlot.start_time,
        timezone: displayTimezone,
        answers: event.questions.map((q) => ({
          question_id: q.id,
          answer_text: answers[q.id] || "",
        })),
      });

      router.push(`/booking-confirmed/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEndTime =
    selectedSlot && event
      ? new Date(
          new Date(selectedSlot.start_time).getTime() +
            event.duration_minutes * 60000
        ).toISOString()
      : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-red-600">{error || "Event not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-10">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-[#d6e0ea] bg-white shadow-sm">
        <div className="absolute right-0 top-0 z-10 h-28 w-28 overflow-hidden">
          <div className="absolute right-[-45px] top-[20px] w-44 rotate-45 bg-[#3f4a52] py-2 text-center text-[10px] font-bold leading-tight text-white shadow-md">
            POWERED BY
            <br />
            Calendly_Clone
          </div>
        </div>

        <div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-[355px_1fr]">
          <aside className="relative border-b border-[#d6e0ea] p-8 lg:border-b-0 lg:border-r lg:p-10">
            {step === "form" && (
              <button
                type="button"
                onClick={() => setStep("calendar")}
                className="mb-10 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-3xl text-blue-600 hover:bg-blue-50"
              >
                ←
              </button>
            )}

            <p className="mb-2 text-lg font-semibold text-gray-500">
              {event.user_name || event.owner_name || event.host_name || "Admin User"}
            </p>

            <h1 className="mb-8 text-2xl font-bold leading-tight text-[#0b2545]">
              {event.name}
            </h1>

            {event.description && (
              <p className="mb-6 text-base leading-relaxed text-gray-600">
                {event.description}
              </p>
            )}

            <div className="space-y-5 text-sm font-semibold text-[#0b2545]">
              <p className="flex items-center gap-3">
                <span className="text-2xl">◷</span>
                {event.duration_minutes} min
              </p>

              <p className="flex items-start gap-3">
                <span className="text-1xl">▣</span>
                <span>
                  {event.location_type === "google_meet" ||
                  event.location_type === "zoom" ||
                  event.location_type === "web_conference" ||
                  event.location_type === "online"
                    ? "Web conferencing details provided upon confirmation."
                    : event.location_type}
                </span>
              </p>

              {step === "form" && selectedSlot && selectedEndTime && (
                <>
                  <p className="flex items-start gap-3">
                    <span className="text-2xl">▣</span>
                    <span>
                      {formatTime(selectedSlot.start_time, displayTimezone)} -{" "}
                      {formatTime(selectedEndTime, displayTimezone)}
                      {selectedDate ? `, ${selectedDate}` : ""}
                    </span>
                  </p>

                  <p className="flex items-center gap-3">
                    <span className="text-2xl">◎</span>
                    {getTimezoneLabel(displayTimezone)}
                  </p>
                </>
              )}
            </div>

            <div className="absolute bottom-8 left-8 flex gap-8 text-sm font-semibold text-blue-600 lg:left-10 lg:text-base">
              <button type="button">Cookie settings</button>
              <button type="button">Privacy Policy</button>
            </div>
          </aside>

          {step === "calendar" && (
            <main className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-[1fr_330px] lg:p-10">
              <section>
                <h2 className="mb-10 text-2xl font-bold text-[#0b2545]">
                  Select a Date & Time
                </h2>

                <Calendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />

                <div className="mt-8">
                  <p className="mb-2 font-bold text-[#0b2545]">Time zone</p>
                  <TimezoneSelect
                    value={displayTimezone}
                    onChange={setDisplayTimezone}
                    compact
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-6 text-center text-lg font-semibold text-[#0b2545]">
                  {selectedDate || "Select a date"}
                </h3>

                {selectedDate && slots.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No available times on this date
                  </p>
                )}

                <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("form");
                      }}
                      className="w-full rounded border border-blue-500 py-4 text-base font-bold text-blue-600 transition hover:border-blue-600 hover:bg-blue-50"
                    >
                      {formatTime(slot.start_time, displayTimezone)}
                    </button>
                  ))}
                </div>
              </section>
            </main>
          )}

          {step === "form" && selectedSlot && (
            <main className="p-8 lg:p-10">
              <h2 className="mb-4 text-3xl font-bold text-[#0b2545]">
                Enter Details
              </h2>

              <form onSubmit={handleSubmit} className="max-w-xl space-y-7">
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                  <label className="mb-2 block font-bold text-[#0b2545]">
                    Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 w-full rounded-md border border-[#9db4cc] px-4 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-bold text-[#0b2545]">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 w-full rounded-md border border-[#9db4cc] px-4 outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="button"
                  className="rounded-full border border-blue-600 px-5 py-2 font-bold text-blue-600 hover:bg-blue-50"
                >
                  Add Guests
                </button>

                {event.questions.map((q) => (
                  <div key={q.id}>
                    <label className="mb-2 block font-bold text-[#0b2545]">
                      {q.question_text}
                      {q.is_required ? " *" : ""}
                    </label>

                    {q.question_type === "textarea" ? (
                      <textarea
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [q.id]: e.target.value })
                        }
                        required={q.is_required}
                        rows={4}
                        className="w-full rounded-md border border-[#9db4cc] px-4 py-3 outline-none focus:border-blue-600"
                      />
                    ) : q.question_type === "select" ? (
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [q.id]: e.target.value })
                        }
                        required={q.is_required}
                        className="h-12 w-full rounded-md border border-[#9db4cc] px-4 outline-none focus:border-blue-600"
                      >
                        <option value="">Select...</option>
                        {q.options.map((o) => (
                          <option key={o.id} value={o.option_text}>
                            {o.option_text}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          q.question_type === "email"
                            ? "email"
                            : q.question_type === "phone"
                            ? "tel"
                            : "text"
                        }
                        value={answers[q.id] || ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [q.id]: e.target.value })
                        }
                        required={q.is_required}
                        className="h-12 w-full rounded-md border border-[#9db4cc] px-4 outline-none focus:border-blue-600"
                      />
                    )}
                  </div>
                ))}

                <p className="text-base leading-relaxed text-[#0b2545]">
                  By proceeding, you confirm that you have read and agree to{" "}
                  <span className="font-bold text-blue-600">
                    Calendly_Clone&apos;s Invitee Terms
                  </span>{" "}
                  and{" "}
                  <span className="font-bold text-blue-600">
                    Privacy Notice.
                  </span>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-blue-600 px-7 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Scheduling..." : "Schedule Event"}
                </button>
              </form>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}