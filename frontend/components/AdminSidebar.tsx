"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconAvailability,
  IconContacts,
  IconDashboard,
  IconEmail,
  IconMeetings,
  IconScheduling,
} from "@/components/icons/SidebarIcons";

const links = [
  { href: "/", label: "Dashboard", Icon: IconDashboard },
  { href: "/admin/event-types", label: "Scheduling", Icon: IconScheduling },
  { href: "/admin/meetings", label: "Meetings", Icon: IconMeetings },
  { href: "/admin/availability", label: "Availability", Icon: IconAvailability },
  { href: "/admin/contacts", label: "Contacts", Icon: IconContacts },
  { href: "/admin/email-notifications", label: "Email Logs", Icon: IconEmail },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006bff] text-white text-sm font-bold shadow-sm"
            aria-hidden
          >
            C
          </span>
          <span className="font-calendly text-[1.35rem] leading-none text-[#006bff] tracking-tight">
            Calendly clone
          </span>
        </Link>
      </div>

      <div className="px-4 pt-4 pb-2">
        <Link
          href="/admin/event-types/new"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <span className="text-base leading-none text-gray-700">+</span>
          Create
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(link.href + "/");
          const { Icon } = link;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#e8f2ff] text-[#006bff]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${active ? "text-[#006bff]" : "text-gray-500"}`}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
