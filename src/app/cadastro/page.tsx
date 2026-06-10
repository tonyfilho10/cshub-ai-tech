import { prisma } from "@/lib/prisma";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  return <SignupForm departments={departments} />;
}
