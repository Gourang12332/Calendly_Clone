import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden bg-gray-50 p-4 sm:p-6 md:p-8 md:overflow-auto">
        {children}
      </main>
    </div>
  );
}
