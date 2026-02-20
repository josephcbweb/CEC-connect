import { prisma } from "../lib/prisma";

async function main() {
    const targetIfsc = 'SBIN0001234';

    console.log(`Finding students whose IFSC code is not ${targetIfsc}...`);

    try {
        // Delete all students whose IFSC code is NOT the target IFSC
        // This includes students where ifsc_code is null or a different string
        const result = await prisma.student.deleteMany({
            where: {
                OR: [
                    {
                        ifsc_code: {
                            not: targetIfsc,
                        },
                    },
                    {
                        ifsc_code: null,
                    }
                ]
            },
        });

        console.log(`Successfully deleted ${result.count} students.`);
    } catch (error) {
        console.error('Error deleting students:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
