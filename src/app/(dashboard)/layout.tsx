import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={user.role}
        name={user.name}
        department={user.department.name}
        avatarUrl={user.avatarUrl ?? null}
        userId={user.id}
        email={user.email}
      />
      <div className="flex flex-1 flex-col bg-navy-50/40">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-end border-b border-navy-100 bg-white px-6">
          <NotificationBell notifications={notifications} iconOnly />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
