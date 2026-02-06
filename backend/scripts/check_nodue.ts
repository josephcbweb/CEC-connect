import { prisma } from "../lib/prisma";

async function main() {
  const requests = await prisma.noDueRequest.findMany({
    take: 5,
    orderBy: { id: "desc" },
    include: {
      noDues: true,
      student: true,
    },
  });

  console.log("Latest NoDueRequests:", JSON.stringify(requests, null, 2));

  const configs = await prisma.dueConfiguration.findMany();
  console.log("DueConfigurations:", JSON.stringify(configs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
