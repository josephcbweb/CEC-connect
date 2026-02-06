
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.groupBy({
    by: ['currentSemester'],
    _count: {
      id: true,
    },
     orderBy: {
      currentSemester: 'asc',
    },
  });
  console.log('Student distribution by semester:');
  console.table(students);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
