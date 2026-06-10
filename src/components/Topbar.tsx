import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserRole } from "@prisma/client";

export function Topbar({
  name,
  role,
  department,
}: {
  name: string;
  role: UserRole;
  department: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-navy-100 bg-white px-6 py-4">
      <div>
        <p className="text-sm font-semibold text-navy-900">{name}</p>
        <p className="text-xs text-navy-400">
          {ROLE_LABELS[role]} · {department}
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
        >
          <LogOut size={16} />
          Sair
        </button>
      </form>
    </header>
  );
}
