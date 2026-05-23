"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, EmailNotification } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function EmailNotificationsPage() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEmailNotifications()
      .then((r) => setNotifications(r.notifications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-5 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">Email Notifications</h1>
      {loading ? (
        <LoadingSpinner text="Loading meetings" className="py-16" />
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 sm:p-12">No email logs yet</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b border-gray-100">
                  <td className="break-all px-4 py-3">{n.recipient_email}</td>
                  <td className="px-4 py-3">{n.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{n.notification_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      n.status === "sent" ? "bg-green-100 text-green-700" :
                      n.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{n.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{n.sent_at ? formatDateTime(n.sent_at) : "-"}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
