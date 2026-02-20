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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../lib/prisma");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var email, aadhaar, student;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = "test_tc_issued_by@example.com";
                    aadhaar = "999988887777";
                    // Cleanup past
                    return [4 /*yield*/, prisma_1.prisma.student.deleteMany({
                            where: { email: email }
                        })];
                case 1:
                    // Cleanup past
                    _a.sent();
                    console.log("Creating test student...");
                    return [4 /*yield*/, prisma_1.prisma.student.create({
                            data: {
                                password: "password123", // Added missing required field
                                religion: "Test Religion", // Added missing required field
                                mother_tongue: "Test Language", // Added missing required field
                                name: "TC Issued By Test",
                                dateOfBirth: new Date("2000-01-01"),
                                gender: "male",
                                email: email,
                                student_phone_number: "9988776655",
                                aadhaar_number: aadhaar,
                                program: "btech",
                                allotted_branch: "CS",
                                last_institution: "Test School Name",
                                qualifying_exam_name: "Test Exam",
                                qualifying_exam_register_no: "REG123",
                                tc_issued_by: "Test TC Issuer",
                                tc_number: "TC123",
                                contact_address: "Fake Contact",
                                permanent_address: "Fake Permanent",
                                state_of_residence: "Kerala",
                                is_fee_concession_eligible: false,
                                admission_type: "regular",
                                status: "pending",
                                fatherName: "Test Father",
                                motherName: "Test Mother"
                            }
                        })];
                case 2:
                    student = _a.sent();
                    console.log("Created student:", student.admission_number, student.name);
                    console.log("Last Institution:", student.last_institution);
                    console.log("TC Issued By:", student.tc_issued_by);
                    if (student.last_institution === "Test School Name" && student.tc_issued_by === "Test TC Issuer") {
                        console.log("SUCCESS: Backend correctly handles, saves, and returns the new institution fields!");
                    }
                    else {
                        console.error("ERROR: Fields were not saved correctly.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var fs = require("fs");
main()
    .catch(function (e) {
    fs.writeFileSync('prisma_error.txt', e.message);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma_1.prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
