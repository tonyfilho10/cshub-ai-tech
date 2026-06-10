import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const departments = [
  "Financeiro",
  "Recursos Humanos",
  "Comercial",
  "TI",
  "Marketing",
  "Operações",
];

async function main() {
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Departamentos criados/atualizados:", departments.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
