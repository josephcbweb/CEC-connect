import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();
export const getStudents = async () => await prisma.student.findMany({});
