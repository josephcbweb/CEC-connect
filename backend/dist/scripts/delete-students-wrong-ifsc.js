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
const prisma_1 = require("../lib/prisma");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetIfsc = 'SBIN0001234';
        console.log(`Finding students whose IFSC code is not ${targetIfsc}...`);
        try {
            // Delete all students whose IFSC code is NOT the target IFSC
            // This includes students where ifsc_code is null or a different string
            const result = yield prisma_1.prisma.student.deleteMany({
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
        }
        catch (error) {
            console.error('Error deleting students:', error);
        }
        finally {
            yield prisma_1.prisma.$disconnect();
        }
    });
}
main();
