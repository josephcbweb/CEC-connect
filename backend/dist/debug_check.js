"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./lib/prisma");
const client_1 = require("./generated/prisma/client");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const studentName = "ANANTHU S NAIR";
        const student = yield prisma_1.prisma.student.findFirst({ where: { name: { contains: "ANANTHU" } } });
        if (!student) {
            console.log("Student ANANTHU not found.");
            return;
        }
        console.log(`Testing for Student: ${student.name} (ID: ${student.id})`);
        console.log(`Semester: S${student.currentSemester}, Dept: ${student.departmentId}`); // Note: department might need include
        const fullStudent = yield prisma_1.prisma.student.findUnique({
            where: { id: student.id },
            include: { department: true }
        });
        if (!fullStudent)
            return;
        const currentSemester = `S${fullStudent.currentSemester}`;
        const deptCode = (_a = fullStudent.department) === null || _a === void 0 ? void 0 : _a.department_code;
        console.log(`Query Params: Sem=${currentSemester}, Dept=${deptCode}, Status=${client_1.NotificationStatus.published}`);
        const notifications = yield prisma_1.prisma.notification.findMany({
            where: {
                status: client_1.NotificationStatus.published,
                OR: [
                    { targetType: client_1.NotificationTargetType.ALL },
                    {
                        targetType: client_1.NotificationTargetType.SEMESTER,
                        targetValue: currentSemester
                    },
                    {
                        targetType: client_1.NotificationTargetType.DEPARTMENT,
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
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
