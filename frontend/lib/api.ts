const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  getEventTypes: () => request<{ event_types: EventTypeListItem[] }>("/api/event-types"),
  getEventType: (id: string) => request<EventTypeDetail>(`/api/event-types/${id}`),
  createEventType: (data: EventTypeCreate) =>
    request<EventTypeCreateResponse>("/api/event-types", { method: "POST", body: JSON.stringify(data) }),
  updateEventType: (id: string, data: Partial<EventTypeCreate>) =>
    request<{ id: string; message: string }>(`/api/event-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEventType: (id: string) =>
    request<{ message: string }>(`/api/event-types/${id}`, { method: "DELETE" }),

  getSchedules: () => request<{ schedules: ScheduleListItem[] }>("/api/availability-schedules"),
  getSchedule: (id: string) => request<ScheduleDetail>(`/api/availability-schedules/${id}`),
  createSchedule: (data: ScheduleCreate) =>
    request<{ id: string; message: string }>("/api/availability-schedules", { method: "POST", body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: ScheduleCreate) =>
    request<{ id: string; message: string }>(`/api/availability-schedules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addOverride: (id: string, data: DateOverrideCreate) =>
    request<{ id: string; message: string }>(`/api/availability-schedules/${id}/overrides`, { method: "POST", body: JSON.stringify(data) }),
  deleteOverride: (scheduleId: string, overrideId: string) =>
    request<{ message: string }>(`/api/availability-schedules/${scheduleId}/overrides/${overrideId}`, { method: "DELETE" }),

  addQuestions: (id: string, data: { questions: QuestionCreate[] }) =>
    request<{ message: string }>(`/api/event-types/${id}/questions`, { method: "POST", body: JSON.stringify(data) }),
  updateQuestions: (id: string, data: { questions: QuestionUpdate[] }) =>
    request<{ message: string }>(`/api/event-types/${id}/questions`, { method: "PUT", body: JSON.stringify(data) }),

  getMeetings: (type: "upcoming" | "past") =>
    request<{ meetings: MeetingItem[] }>(`/api/meetings?type=${type}`),
  cancelMeeting: (id: string, reason?: string) =>
    request<CancelResponse>(`/api/meetings/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  rescheduleMeeting: (id: string, data: { new_start_time: string; timezone: string }) =>
    request<RescheduleResponse>(`/api/meetings/${id}/reschedule`, { method: "POST", body: JSON.stringify(data) }),

  getEmailNotifications: () =>
    request<{ notifications: EmailNotification[] }>("/api/email-notifications"),

  getContacts: (filter: "all" | "new" | "repeat", search?: string) => {
    const params = new URLSearchParams({ filter });
    if (search?.trim()) params.set("search", search.trim());
    return request<{ contacts: ContactItem[]; total: number }>(`/api/contacts?${params}`);
  },
  createContact: (data: ContactCreate) =>
    request<{ id: string; message: string }>("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
  deleteContact: (id: string) =>
    request<{ message: string }>(`/api/contacts/${id}`, { method: "DELETE" }),

  getPublicEvent: (slug: string) => request<PublicEventType>(`/api/public/event-types/${slug}`),
  getSlots: (slug: string, date: string) =>
    request<SlotsResponse>(`/api/public/event-types/${slug}/slots?date=${date}`),
  createBooking: (data: BookingCreate) =>
    request<BookingResponse>("/api/public/bookings", { method: "POST", body: JSON.stringify(data) }),
  getBooking: (id: string) => request<BookingConfirmation>(`/api/public/bookings/${id}`),
  getBookingByToken: (token: string) => request<TokenBooking>(`/api/public/bookings/token/${token}`),
  cancelByToken: (token: string, reason?: string) =>
    request<CancelResponse>(`/api/public/bookings/cancel/${token}`, { method: "POST", body: JSON.stringify({ reason }) }),
  rescheduleByToken: (token: string, data: { new_start_time: string; timezone: string }) =>
    request<RescheduleResponse>(`/api/public/bookings/reschedule/${token}`, { method: "POST", body: JSON.stringify(data) }),
};

export interface EventTypeListItem {
  location_type: any;
  event_kind: any;
  availability_summary: string;
  id: string;
  name: string;
  slug: string;
  duration_minutes: number;
  public_url: string;
  is_active: boolean;
}

export interface EventTypeDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  schedule_id?: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  location_type: string;
  is_active: boolean;
  questions: Question[];
}

export interface EventTypeCreate {
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  schedule_id?: string;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  location_type?: string;
  is_active?: boolean;
}

export interface EventTypeCreateResponse {
  id: string;
  name: string;
  slug: string;
  public_url: string;
  duration_minutes: number;
  is_active: boolean;
  message: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  display_order: number;
  options: { id: string; option_text: string; display_order: number }[];
}

export interface QuestionCreate {
  question_text: string;
  question_type: string;
  is_required: boolean;
  display_order: number;
  options: { option_text: string; display_order: number }[];
}

export interface QuestionUpdate extends QuestionCreate {
  id?: string;
}

export interface ScheduleListItem {
  id: string;
  name: string;
  timezone: string;
  is_default: boolean;
}

export interface ScheduleDetail extends ScheduleListItem {
  rules: { id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }[];
  overrides: {
    id: string;
    override_date: string;
    is_unavailable: boolean;
    reason?: string;
    slots: { start_time: string; end_time: string }[];
  }[];
}

export interface ScheduleCreate {
  name: string;
  timezone: string;
  is_default: boolean;
  rules: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[];
}

export interface DateOverrideCreate {
  override_date: string;
  is_unavailable: boolean;
  reason?: string;
  slots: { start_time: string; end_time: string }[];
}

export interface MeetingItem {
  id: string;
  event_name: string;
  invitee_name: string;
  invitee_email: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface EmailNotification {
  id: string;
  booking_id?: string;
  recipient_email: string;
  subject: string;
  notification_type: string;
  status: string;
  sent_at?: string;
}

export interface PublicEventType {
  user_name: any;
  owner_name: any;
  host_name: any;
  id: string;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  location_type: string;
  timezone: string;
  questions: Question[];
}

export interface Slot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface SlotsResponse {
  date: string;
  timezone: string;
  slots: Slot[];
}

export interface BookingCreate {
  event_type_id: string;
  invitee_name: string;
  invitee_email: string;
  start_time: string;
  timezone: string;
  answers: { question_id: string; answer_text: string }[];
}

export interface BookingResponse {
  id: string;
  status: string;
  event_name: string;
  invitee_name: string;
  invitee_email: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  cancel_url: string;
  reschedule_url: string;
  message: string;
}

export interface BookingConfirmation {
  id: string;
  status: string;
  event_name: string;
  invitee_name: string;
  invitee_email: string;
  start_time: string;
  end_time: string;
  timezone: string;
  meeting_url?: string;
}

export interface TokenBooking extends BookingConfirmation {
  event_slug: string;
  event_type_id: string;
  duration_minutes: number;
}

export interface CancelResponse {
  id: string;
  status: string;
  cancelled_at?: string;
  message: string;
}

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  last_meeting_date?: string;
  next_meeting_date?: string;
  meeting_count: number;
  is_new: boolean;
  source: string;
}

export interface ContactCreate {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface RescheduleResponse {
  old_booking_id: string;
  new_booking_id: string;
  old_status: string;
  new_status: string;
  new_start_time: string;
  message: string;
}
