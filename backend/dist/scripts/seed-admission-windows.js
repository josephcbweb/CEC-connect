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
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
function seedAdmissionWindows() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🌱 Seeding admission windows...");
        try {
            // Check if admission windows already exist
            const existingWindows = yield prisma_1.prisma.admissionWindow.findMany();
            if (existingWindows.length > 0) {
                console.log("✅ Admission windows already exist. Skipping seed.");
                return;
            }
            // Create admission windows for B.Tech and MCA
            const currentYear = new Date().getFullYear();
            const btechWindow = yield prisma_1.prisma.admissionWindow.create({
                data: {
                    program: enums_1.Program.btech,
                    startDate: new Date(`${currentYear}-01-01`),
                    endDate: new Date(`${currentYear}-05-31`),
                    isOpen: true,
                    description: `B.Tech admissions for ${currentYear}-${currentYear + 1} academic year. Applications are now open for various specializations.`,
                },
            });
            const mcaWindow = yield prisma_1.prisma.admissionWindow.create({
                data: {
                    program: enums_1.Program.mca,
                    startDate: new Date(`${currentYear}-06-01`),
                    endDate: new Date(`${currentYear}-07-15`),
                    isOpen: true,
                    description: `MCA admissions for ${currentYear}-${currentYear + 1} academic year. Apply now for Master of Computer Applications program.`,
                },
            });
            console.log("✅ Created B.Tech admission window:", btechWindow);
            console.log("✅ Created MCA admission window:", mcaWindow);
            console.log("🎉 Admission windows seeded successfully!");
        }
        catch (error) {
            console.error("❌ Error seeding admission windows:", error);
            throw error;
        }
    });
}
seedAdmissionWindows()
    .catch((e) => {
    console.error("An error occurred during seeding:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
