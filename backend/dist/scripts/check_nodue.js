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
        const requests = yield prisma_1.prisma.noDueRequest.findMany({
            take: 5,
            orderBy: { id: "desc" },
            include: {
                noDues: true,
                student: true,
            },
        });
        console.log("Latest NoDueRequests:", JSON.stringify(requests, null, 2));
        const configs = yield prisma_1.prisma.dueConfiguration.findMany();
        console.log("DueConfigurations:", JSON.stringify(configs, null, 2));
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
