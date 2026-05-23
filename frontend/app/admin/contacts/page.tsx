"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ContactItem, ContactCreate } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

type FilterType = "all" | "new" | "repeat";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All contacts" },
  { id: "new", label: "New contacts" },
  { id: "repeat", label: "Repeat contacts" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMeetingDate(iso?: string) {
  if (!iso) return "—";
  return formatDateTime(iso);
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ContactCreate>({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    api
      .getContacts(filter, search)
      .then((r) => setContacts(r.contacts))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createContact({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        company: form.company || undefined,
      });
      setShowAdd(false);
      setForm({ name: "", email: "", phone: "", company: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: ContactItem) => {
    if (contact.source !== "manual") return;
    if (!confirm(`Remove ${contact.name} from your contacts list?`)) return;
    await api.deleteContact(contact.id);
    load();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-6xl">
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Contacts</h1>
          <button type="button" onClick={() => setShowAdd(true)} className="btn-calendly w-full sm:w-auto">
            <span className="text-lg leading-none">+</span>
            Add contact
          </button>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:mb-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`filter-pill ${filter === f.id ? "filter-pill-active" : "filter-pill-inactive"}`}
            >
              {filter === f.id && (
                <svg className="w-4 h-4 inline mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {f.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full min-w-0 flex-1 sm:min-w-[240px] sm:max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search by name and email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] focus:border-transparent"
            />
          </div>
          <button type="button" className="filter-pill filter-pill-inactive w-full text-gray-600 sm:w-auto">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Show columns
            </span>
          </button>
          <button type="button" className="filter-pill filter-pill-inactive w-full text-gray-600 sm:w-auto">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </span>
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={contacts.length > 0 && selected.size === contacts.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {["Name", "Email", "Phone number", "Last meeting date", "Next meeting date", "Company", ""].map(
                    (col) => (
                      <th
                        key={col || "actions"}
                        className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col}
                          {col && (
                            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Column options">
                              ⋮
                            </button>
                          )}
                        </span>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <LoadingSpinner text="Loading meetings" className="py-16" />
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      No contacts found. Add a contact or book a meeting to see invitees here.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[#006bff] text-xs font-semibold">
                            {getInitials(c.name)}
                          </span>
                          <span className="break-words font-medium text-gray-900">{c.name}</span>
                          {c.is_new && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 break-all">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatMeetingDate(c.last_meeting_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatMeetingDate(c.next_meeting_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.company || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {c.source === "manual" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="text-gray-400 hover:text-red-600 text-lg leading-none"
                            title="Delete contact"
                          >
                            ⋮
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && contacts.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            {filter !== "all" ? ` · ${FILTERS.find((f) => f.id === filter)?.label}` : ""}
          </p>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add contact</h3>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006bff] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" disabled={saving} className="btn-calendly flex-1">
                  {saving ? "Adding..." : "Add contact"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setError(""); }}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
