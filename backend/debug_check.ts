
import { prisma } from './lib/prisma';
import { NotificationStatus, NotificationTargetType } from './generated/prisma/client';

async function main() {
    const studentName = "ANANTHU S NAIR";
    const student = await prisma.student.findFirst({ where: { name: { contains: "ANANTHU" } } });
    
    if (!student) {
        console.log("Student ANANTHU not found.");
        return;
    }
    
    console.log(`Testing for Student: ${student.name} (ID: ${student.id})`);
    console.log(`Semester: S${student.currentSemester}, Dept: ${student.departmentId}`); // Note: department might need include

    const fullStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: { department: true }
    });
    
    if (!fullStudent) return;
    
    const currentSemester = `S${fullStudent.currentSemester}`;
    const deptCode = fullStudent.department?.department_code;

    console.log(`Query Params: Sem=${currentSemester}, Dept=${deptCode}, Status=${NotificationStatus.published}`);

    const notifications = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.published,
        OR: [
          { targetType: NotificationTargetType.ALL },
          { 
            targetType: NotificationTargetType.SEMESTER,
            targetValue: currentSemester 
          },
          {
            targetType: NotificationTargetType.DEPARTMENT,
            targetValue: deptCode
          }
        ],
        AND: [
            {
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gte: new Date() } }
                ]
            }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
    
    console.log(`\nQuery Found ${notifications.length} notifications.`);
    notifications.forEach(n => console.log(` - ${n.title} [${n.targetType}]`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
