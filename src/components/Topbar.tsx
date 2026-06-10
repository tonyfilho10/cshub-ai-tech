import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
        <Button type="submit" variant="outline">
          <LogOut size={16} />
          Sair
        </Button>
      </form>
    </header>
  );
}
