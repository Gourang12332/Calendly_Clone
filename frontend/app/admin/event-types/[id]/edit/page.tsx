"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { api, EventTypeDetail, ScheduleListItem, QuestionUpdate } from "@/lib/api";
import { QUESTION_SUGGESTIONS, QuestionSuggestion } from "@/lib/questionSuggestions";
import { slugify } from "@/lib/utils";

export default function EditEventTypePage() {
  const params = useParams();
  const id = params.id as string;
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [scheduleId, setScheduleId] = useState("");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [locationType, setLocationType] = useState("online");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<QuestionUpdate[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getEventType(id), api.getSchedules()]).then(([et, sch]) => {
      setName(et.name);
      setSlug(et.slug);
      setDescription(et.description || "");
      setDuration(et.duration_minutes);
      setScheduleId(et.schedule_id || "");
      setBufferBefore(et.buffer_before_minutes);
      setBufferAfter(et.buffer_after_minutes);
      setLocationType(et.location_type);
      setIsActive(et.is_active);
      setQuestions(
        et.questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: q.is_required,
          display_order: q.display_order,
          options: q.options.map((o) => ({ option_text: o.option_text, display_order: o.display_order })),
        }))
      );
      setSchedules(sch.schedules);
    });
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", question_type: "text", is_required: false, display_order: questions.length + 1, options: [] }]);
  };

  const applySuggestion = (suggestion: QuestionSuggestion) => {
    const alreadyAdded = questions.some(
      (q) => q.question_text.trim().toLowerCase() === suggestion.question_text.trim().toLowerCase()
    );
    if (alreadyAdded) return;

    setQuestions([
      ...questions,
      {
        question_text: suggestion.question_text,
        question_type: suggestion.question_type,
        is_required: suggestion.is_required ?? false,
        display_order: questions.length + 1,
        options: suggestion.options ? [...suggestion.options] : [],
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (
    idx: number,
    field: keyof QuestionUpdate,
    value: string | boolean | number
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              [field]: value,
            }
          : q
      )
    );
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({ option_text: "", display_order: updated[qIdx].options.length + 1 });
    setQuestions(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateEventType(id, {
        name,
        slug,
        description,
        duration_minutes: duration,
        schedule_id: scheduleId || undefined,
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
        location_type: locationType,
        is_active: isActive,
      });
      await api.updateQuestions(id, {
        questions: questions.map((q, i) => ({
          ...q,
          display_order: i + 1,
        })),
      });
      alert("Saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5 sm:mb-6">
        <Link href="/admin/event-types" className="text-sm text-primary-600 hover:underline">← Back to Event Types</Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">Edit Event Type</h1>
      </div>
      <form onSubmit={handleSave} className="w-full max-w-2xl space-y-5 sm:space-y-6">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Default</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Before</label>
              <input type="number" min={0} value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer After</label>
              <input type="number" min={0} value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Custom Questions</h2>
            <button type="button" onClick={addQuestion} className="text-sm text-primary-600 font-medium">+ Add Question</button>
          </div>

          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Suggested questions</p>
            <p className="text-xs text-gray-500 mb-3">Click to add a common question to your booking form</p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_SUGGESTIONS.map((s) => {
                const added = questions.some(
                  (q) => q.question_text.trim().toLowerCase() === s.question_text.trim().toLowerCase()
                );
                return (
                  <button
                    key={s.question_text}
                    type="button"
                    disabled={added}
                    onClick={() => applySuggestion(s)}
                    className={`text-left text-xs px-3 py-2 rounded-full border transition-colors max-w-full ${
                      added
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-primary-200 bg-white text-primary-700 hover:bg-primary-50 hover:border-primary-400"
                    }`}
                    title={added ? "Already added" : `Add: ${s.question_text}`}
                  >
                    + {s.question_text.length > 48 ? `${s.question_text.slice(0, 48)}…` : s.question_text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {questions.length === 0 && (
              <p className="text-sm text-gray-500">No custom questions yet. Use a suggestion above or add your own.</p>
            )}
            {questions.map((q, idx) => (
              <div key={idx} className="space-y-3 rounded-lg border border-gray-100 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-400">Question {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input value={q.question_text} onChange={(e) => updateQuestion(idx, "question_text", e.target.value)} placeholder="Question text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select value={q.question_type} onChange={(e) => updateQuestion(idx, "question_type", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-auto">
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="select">Select</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={q.is_required} onChange={(e) => updateQuestion(idx, "is_required", e.target.checked)} />
                    Required
                  </label>
                </div>
                {q.question_type === "select" && (
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <input
                        key={oIdx}
                        value={opt.option_text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].options[oIdx].option_text = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Option text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    ))}
                    <button type="button" onClick={() => addOption(idx)} className="text-xs text-primary-600">+ Add Option</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AdminLayout>
  );
}
