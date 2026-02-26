
import { prisma } from "./lib/prisma";

async function main() {
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
  });
  console.log(departments);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
