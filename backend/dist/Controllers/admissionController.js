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
exports.bulkAssignToClass = exports.autoAssignStudentsToClasses = exports.assignStudentToClass = exports.getUpcomingBatches = exports.getClassesForBatch = exports.getApprovedStudentsForAssignment = exports.bulkUpdateStatus = exports.getAdmissionByNumber = exports.submitAdmissionForm = exports.getPublicDepartments = exports.validateStudent = exports.checkAdmissionStatus = exports.createAdmissionWindow = exports.deleteAdmissionWindow = exports.updateAdmissionWindow = exports.getAdmissionWindows = exports.updateAdmissionStatus = exports.getAdmissionById = exports.getStats = exports.getAdmissions = void 0;
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
// Get all admissions with filtering and pagination
const getAdmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "20", status, program, search, admissionType, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status && status !== "all") {
            where.status = status;
        }
        if (program && program !== "all") {
            where.program = program;
        }
        if (admissionType && admissionType !== "all") {
            where.admission_type = admissionType;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                {
                    admission_number: { contains: search, mode: "insensitive" },
                },
            ];
        }
        const [students, total] = yield Promise.all([
            prisma_1.prisma.student.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    department: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma_1.prisma.student.count({ where }),
        ]);
        res.json({
            success: true,
            data: students,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching admissions:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to fetch admissions" });
    }
});
exports.getAdmissions = getAdmissions;
// Get admission statistics
const getStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [total, pending, approved, rejected, waitlisted] = yield Promise.all([
            prisma_1.prisma.student.count(),
            prisma_1.prisma.student.count({ where: { status: enums_1.StudentStatus.pending } }),
            prisma_1.prisma.student.count({ where: { status: enums_1.StudentStatus.approved } }),
            prisma_1.prisma.student.count({ where: { status: enums_1.StudentStatus.rejected } }),
            prisma_1.prisma.student.count({ where: { status: enums_1.StudentStatus.waitlisted } }),
        ]);
        // Program-wise stats
        const btechCount = yield prisma_1.prisma.student.count({
            where: { program: enums_1.Program.btech },
        });
        const mcaCount = yield prisma_1.prisma.student.count({
            where: { program: enums_1.Program.mca },
        });
        // Admission type stats
        const regularCount = yield prisma_1.prisma.student.count({
            where: { admission_type: enums_1.AdmissionType.regular },
        });
        const lateralCount = yield prisma_1.prisma.student.count({
            where: { admission_type: enums_1.AdmissionType.lateral },
        });
        const nriCount = yield prisma_1.prisma.student.count({
            where: { admission_type: enums_1.AdmissionType.nri },
        });
        const managementCount = yield prisma_1.prisma.student.count({
            where: { admission_type: enums_1.AdmissionType.management },
        });
        res.json({
            success: true,
            stats: {
                total,
                pending,
                approved,
                rejected,
                waitlisted,
                byProgram: {
                    btech: btechCount,
                    mca: mcaCount,
                },
                byAdmissionType: {
                    regular: regularCount,
                    lateral: lateralCount,
                    nri: nriCount,
                    management: managementCount,
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching stats:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to fetch statistics" });
    }
});
exports.getStats = getStats;
// Get single admission by ID
const getAdmissionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const student = yield prisma_1.prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: {
                department: true,
            },
        });
        if (!student) {
            return res
                .status(404)
                .json({ success: false, error: "Admission not found" });
        }
        res.json({ success: true, data: student });
    }
    catch (error) {
        console.error("Error fetching admission:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to fetch admission details" });
    }
});
exports.getAdmissionById = getAdmissionById;
// Update admission status
const updateAdmissionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        if (!Object.values(enums_1.StudentStatus).includes(status)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid status value" });
        }
        const updatedStudent = yield prisma_1.prisma.student.update({
            where: { id: parseInt(id) },
            data: {
                status,
                updatedAt: new Date(),
            },
        });
        // TODO: Send notification to student about status change
        res.json({
            success: true,
            message: `Application ${status} successfully`,
            data: updatedStudent,
        });
    }
    catch (error) {
        console.error("Error updating admission status:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to update admission status" });
    }
});
exports.updateAdmissionStatus = updateAdmissionStatus;
// Get admission windows
const getAdmissionWindows = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const windows = yield prisma_1.prisma.admissionWindow.findMany({
            include: { batch: true }, // Crucial for displaying batch name in frontend
            orderBy: { program: "asc" },
        });
        const now = new Date();
        // Normalize dates to include full days (start of day to end of day)
        const startOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(0, 0, 0, 0);
            return nd;
        };
        const endOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(23, 59, 59, 999);
            return nd;
        };
        // Dynamically calculate status for the frontend
        const processedWindows = windows.map((window) => {
            const start = startOfDay(new Date(window.startDate));
            const end = endOfDay(new Date(window.endDate));
            return Object.assign(Object.assign({}, window), { isOpen: window.isOpen && now >= start && now <= end });
        });
        res.json({ success: true, data: processedWindows });
    }
    catch (error) {
        console.error("Error fetching admission windows:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to fetch admission windows" });
    }
});
exports.getAdmissionWindows = getAdmissionWindows;
// Update admission window
const updateAdmissionWindow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isOpen, startDate, endDate, description } = req.body;
        const current = yield prisma_1.prisma.admissionWindow.findUnique({
            where: { id: parseInt(id) },
        });
        if (!current)
            return res
                .status(404)
                .json({ success: false, error: "Window not found" });
        const newStart = startDate ? new Date(startDate) : current.startDate;
        const newEnd = endDate ? new Date(endDate) : current.endDate;
        const now = new Date();
        // Re-validate isOpen: Must be true only if within date range
        const startOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(0, 0, 0, 0);
            return nd;
        };
        const endOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(23, 59, 59, 999);
            return nd;
        };
        const ns = startOfDay(newStart);
        const ne = endOfDay(newEnd);
        const validatedIsOpen = isOpen !== undefined
            ? isOpen && now >= ns && now <= ne
            : current.isOpen && now >= ns && now <= ne;
        const updatedWindow = yield prisma_1.prisma.admissionWindow.update({
            where: { id: parseInt(id) },
            data: {
                isOpen: validatedIsOpen,
                startDate: newStart,
                endDate: newEnd,
                description,
            },
        });
        res.json({ success: true, data: updatedWindow });
    }
    catch (error) {
        console.error("Error updating admission window:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to update admission window" });
    }
});
exports.updateAdmissionWindow = updateAdmissionWindow;
// Delete admission window
const deleteAdmissionWindow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Use a transaction with custom timeouts to prevent P2028
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Fetch window to get the linked batchId
            const window = yield tx.admissionWindow.findUnique({
                where: { id: parseInt(id) },
                select: { batchId: true },
            });
            if (!window) {
                throw new Error("Admission window not found");
            }
            // 2. Activate the Batch (UPCOMING -> ACTIVE)
            if (window.batchId) {
                yield tx.batch.update({
                    where: { id: window.batchId },
                    data: { status: "ACTIVE" },
                });
            }
            // 3. Delete the AdmissionWindow record
            yield tx.admissionWindow.delete({
                where: { id: parseInt(id) },
            });
        }), {
            maxWait: 10000, // Wait 10s for a connection
            timeout: 20000, // Allow 20s for the work to finish
        });
        res.json({
            success: true,
            message: "Admission finalized: Batch is now ACTIVE and window removed.",
        });
    }
    catch (error) {
        console.error("Error deleting admission window:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to finalize admission",
        });
    }
});
exports.deleteAdmissionWindow = deleteAdmissionWindow;
// Create admission window
const createAdmissionWindow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { program, startDate, endDate, description, isOpen, batchName, startYear, endYear, departmentIds, } = req.body;
        // 1. Basic validation
        if (!batchName ||
            !startYear ||
            !endYear ||
            !departmentIds ||
            !Array.isArray(departmentIds)) {
            return res.status(400).json({
                success: false,
                error: "Batch details and at least one department are required.",
            });
        }
        // 2. Run the transaction with increased timeout settings
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Check if window already exists for this program
            const existingWindow = yield tx.admissionWindow.findFirst({
                where: { program },
            });
            if (existingWindow) {
                // Throwing error inside transaction triggers automatic rollback
                throw new Error(`Admission window for ${program.toUpperCase()} already exists`);
            }
            // Create the Batch and link Departments
            const newBatch = yield tx.batch.create({
                data: {
                    name: batchName,
                    startYear: Number(startYear),
                    endYear: Number(endYear),
                    status: "UPCOMING",
                    batchDepartments: {
                        create: departmentIds.map((deptId) => ({
                            departmentId: Number(deptId),
                        })),
                    },
                },
            });
            // Create the Admission Window
            const newWindow = yield tx.admissionWindow.create({
                data: {
                    program,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    description,
                    isOpen: isOpen !== null && isOpen !== void 0 ? isOpen : false,
                    batchId: newBatch.id, // Ensure this link is present
                },
            });
            return { newBatch, newWindow };
        }), {
            // P2028 FIX: Give the engine more time to acquire a connection and finish
            maxWait: 10000, // default is 2s, increased to 10s
            timeout: 20000, // default is 5s, increased to 20s
        });
        res.status(201).json({
            success: true,
            message: "Admission window opened and Batch initialized successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error setting up admission:", error);
        // Handle the specific transaction timeout error for better UX
        if (error.code === "P2028") {
            return res.status(504).json({
                success: false,
                error: "Database is busy. Please try again in a few seconds.",
            });
        }
        res.status(((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("already exists")) ? 400 : 500).json({
            success: false,
            error: error.message || "Failed to setup admission window and batch",
        });
    }
});
exports.createAdmissionWindow = createAdmissionWindow;
// Check admission status (public endpoint for students)
const checkAdmissionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentDate = new Date();
        const windows = yield prisma_1.prisma.admissionWindow.findMany();
        const status = {
            admissionsOpen: {},
        };
        const startOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(0, 0, 0, 0);
            return nd;
        };
        const endOfDay = (d) => {
            const nd = new Date(d);
            nd.setHours(23, 59, 59, 999);
            return nd;
        };
        windows.forEach((window) => {
            const start = startOfDay(new Date(window.startDate));
            const end = endOfDay(new Date(window.endDate));
            const isWithinDateRange = currentDate >= start && currentDate <= end;
            const isOpen = window.isOpen && isWithinDateRange;
            status.admissionsOpen[window.program] = {
                open: isOpen,
                deadline: window.endDate.toISOString().split("T")[0],
                description: window.description || `${window.program.toUpperCase()} admissions`,
            };
        });
        res.json(status);
    }
    catch (error) {
        console.error("Error checking admission status:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to check admission status" });
    }
});
exports.checkAdmissionStatus = checkAdmissionStatus;
// Validate email and Aadhaar (for admission form)
const validateStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, aadhaar } = req.body;
        const [emailExists, aadhaarExists] = yield Promise.all([
            email ? prisma_1.prisma.student.findUnique({ where: { email } }) : null,
            aadhaar
                ? prisma_1.prisma.student.findUnique({ where: { aadhaar_number: aadhaar } })
                : null,
        ]);
        if (emailExists) {
            return res.status(409).json({
                success: false,
                emailExists: true,
                message: "An account with this email already exists",
            });
        }
        if (aadhaarExists) {
            return res.status(409).json({
                success: false,
                aadhaarExists: true,
                message: "An account with this Aadhaar number already exists",
            });
        }
        res.json({
            success: true,
            emailExists: false,
            aadhaarExists: false,
            message: "Validation passed",
        });
    }
    catch (error) {
        console.error("Error validating student:", error);
        res.status(500).json({ success: false, error: "Validation failed" });
    }
});
exports.validateStudent = validateStudent;
// Submit admission form (for students)
// Get departments for public admission form
const getPublicDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { program } = req.query;
        // Fetch departments - optionally filter by program if needed
        const departments = yield prisma_1.prisma.department.findMany({
            select: {
                id: true,
                name: true,
                department_code: true,
            },
            orderBy: {
                name: "asc",
            },
        });
        res.json({
            success: true,
            data: departments,
        });
    }
    catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch departments",
        });
    }
});
exports.getPublicDepartments = getPublicDepartments;
const submitAdmissionForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const formData = req.body;
        const activeBatch = yield prisma_1.prisma.batch.findFirst({
            where: {
                status: "UPCOMING", // Or logic to find the batch linked to the open window
            },
        });
        if (!activeBatch) {
            return res
                .status(400)
                .json({ success: false, error: "No active admission batch found." });
        }
        // Generate admission number
        const year = new Date().getFullYear();
        const count = yield prisma_1.prisma.student.count({
            where: { program: formData.program },
        });
        const admissionNumber = `${formData.program.toUpperCase()}-${year}-${String(count + 1).padStart(3, "0")}`;
        console.log("Received form data:", formData);
        const newStudent = yield prisma_1.prisma.student.create({
            data: {
                // Personal Info
                name: formData.name,
                dateOfBirth: formData.dateOfBirth
                    ? new Date(formData.dateOfBirth)
                    : new Date(),
                gender: formData.gender,
                email: formData.email,
                student_phone_number: formData.phone,
                aadhaar_number: formData.aadhaar,
                blood_group: formData.bloodGroup || null,
                religion: formData.religion || "Not Specified",
                nationality: formData.nationality || "Indian",
                mother_tongue: formData.motherTongue || "Not Specified",
                // Parent Info
                fatherName: formData.fatherName || null,
                father_phone_number: formData.fatherPhone || null,
                motherName: formData.motherName || null,
                mother_phone_number: formData.motherPhone || null,
                parent_email: formData.parentEmail || null,
                annual_family_income: formData.annualFamilyIncome || null,
                guardian_name: formData.guardianName || null,
                guardian_relationship: formData.guardianRelationship || null,
                guardian_email: formData.guardianEmail || null,
                // Address Info
                permanent_address: formData.permanentAddress,
                contact_address: formData.contactAddress || formData.permanentAddress,
                state_of_residence: formData.stateOfResidence || formData.permanentAddressState,
                local_guardian_address: formData.localGuardianAddress || null,
                local_guardian_phone_number: formData.localGuardianPhone || null,
                // Education Info
                last_institution: formData.qualifyingExamInstitute || "Not Specified",
                qualifying_exam_name: formData.qualifyingExam,
                qualifying_exam_register_no: formData.qualifyingExamRegisterNo,
                physics_score: formData.physicsScore
                    ? parseFloat(formData.physicsScore)
                    : null,
                chemistry_score: formData.chemistryScore
                    ? parseFloat(formData.chemistryScore)
                    : null,
                maths_score: formData.mathsScore
                    ? parseFloat(formData.mathsScore)
                    : null,
                percentage: formData.totalPercentage
                    ? parseFloat(formData.totalPercentage)
                    : null,
                previous_degree_cgpa_or_total_marks: formData.previousDegreeCGPA
                    ? parseFloat(formData.previousDegreeCGPA)
                    : null,
                tc_number: formData.tcNumber || null,
                tc_date: formData.tcDate ? new Date(formData.tcDate) : null,
                // Entrance Info
                entrance_type: formData.entranceExamType || null,
                entrance_roll_no: formData.entranceExamRollNumber || null,
                entrance_rank: formData.entranceRank
                    ? parseInt(formData.entranceRank)
                    : null,
                entrance_total_score: formData.entranceExamScore
                    ? parseFloat(formData.entranceExamScore)
                    : null,
                keam_subject_total: formData.keamSubjectTotal
                    ? parseFloat(formData.keamSubjectTotal)
                    : null,
                // Bank Info
                account_number: formData.bankAccountNumber || null,
                bank_name: formData.bankName || null,
                ifsc_code: formData.bankIFSCCode || null,
                bank_branch: formData.bankBranch || null,
                // Additional Info
                category: formData.category || "General",
                admission_quota: formData.admissionQuota || "general",
                admitted_category: formData.admittedCategory || formData.category,
                // System fields
                program: formData.program,
                admission_type: formData.admissionType || "regular",
                admission_number: admissionNumber,
                admission_date: new Date(),
                status: enums_1.StudentStatus.pending,
                password: "changeme123", // Default password
                allotted_branch: formData.allottedBranch || "Not Assigned",
                // Preferred department is stored for reference during class assignment
                preferredDepartmentId: formData.preferredDepartment
                    ? parseInt(formData.preferredDepartment)
                    : null,
                // Department will be assigned by admin after approval - use a placeholder department
                // The student's departmentId will be properly assigned when admin assigns them to a class
                departmentId: formData.departmentId || null,
                classId: null, // Class will be assigned by admin after approval
            },
            include: {
                department: true,
            },
        });
        res.status(201).json({
            success: true,
            studentId: newStudent.id,
            admissionNumber,
            message: `Your admission form has been submitted successfully. Your admission number is ${admissionNumber}`,
            formUrl: `/admission/${admissionNumber}`,
        });
    }
    catch (error) {
        console.error("Error submitting admission form:", error);
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: "A student with this email or Aadhaar already exists",
            });
        }
        res
            .status(500)
            .json({ success: false, error: "Failed to submit admission form" });
    }
});
exports.submitAdmissionForm = submitAdmissionForm;
// Get admission by admission number
const getAdmissionByNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { admissionNumber } = req.params;
        const student = yield prisma_1.prisma.student.findUnique({
            where: { admission_number: admissionNumber },
            include: {
                department: true,
            },
        });
        if (!student) {
            return res
                .status(404)
                .json({ success: false, error: "Admission not found" });
        }
        res.json({ success: true, data: student });
    }
    catch (error) {
        console.error("Error fetching admission:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to fetch admission" });
    }
});
exports.getAdmissionByNumber = getAdmissionByNumber;
// Bulk update admissions (approve/reject multiple)
const bulkUpdateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid student IDs" });
        }
        if (!Object.values(enums_1.StudentStatus).includes(status)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid status value" });
        }
        yield prisma_1.prisma.student.updateMany({
            where: {
                id: { in: ids.map((id) => parseInt(id)) },
            },
            data: {
                status,
                updatedAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: `${ids.length} applications updated successfully`,
        });
    }
    catch (error) {
        console.error("Error bulk updating status:", error);
        res
            .status(500)
            .json({ success: false, error: "Failed to update applications" });
    }
});
exports.bulkUpdateStatus = bulkUpdateStatus;
// Get approved students ready for class assignment
const getApprovedStudentsForAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { program, page, limit, preferredDepartmentId } = req.query;
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {
            status: enums_1.StudentStatus.approved,
            classId: null, // Only students not yet assigned to a class
        };
        if (program && program !== "all") {
            where.program = program;
        }
        if (preferredDepartmentId && preferredDepartmentId !== "all") {
            where.preferredDepartmentId = parseInt(preferredDepartmentId);
        }
        const [students, total] = yield Promise.all([
            prisma_1.prisma.student.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    program: true,
                    admission_number: true,
                    entrance_rank: true,
                    admission_type: true,
                    category: true,
                    preferredDepartmentId: true,
                    preferredDepartment: {
                        select: {
                            id: true,
                            name: true,
                            department_code: true,
                        },
                    },
                },
                orderBy: [{ entrance_rank: "asc" }, { name: "asc" }],
            }),
            prisma_1.prisma.student.count({ where }),
        ]);
        res.json({
            success: true,
            data: students,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching approved students:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch approved students",
        });
    }
});
exports.getApprovedStudentsForAssignment = getApprovedStudentsForAssignment;
// Get available classes for a specific batch
const getClassesForBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const batch = yield prisma_1.prisma.batch.findUnique({
            where: { id: parseInt(batchId) },
            include: {
                batchDepartments: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                department_code: true,
                            },
                        },
                        classes: {
                            include: {
                                _count: {
                                    select: { students: true },
                                },
                            },
                        },
                    },
                },
                admissionWindow: {
                    select: {
                        program: true,
                    },
                },
            },
        });
        if (!batch) {
            return res.status(404).json({
                success: false,
                error: "Batch not found",
            });
        }
        res.json({
            success: true,
            data: batch,
        });
    }
    catch (error) {
        console.error("Error fetching classes for batch:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch classes",
        });
    }
});
exports.getClassesForBatch = getClassesForBatch;
// Get batches with UPCOMING status (for class assignment)
const getUpcomingBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batches = yield prisma_1.prisma.batch.findMany({
            where: {
                status: { in: ["UPCOMING", "ACTIVE"] },
            },
            include: {
                batchDepartments: {
                    include: {
                        department: {
                            select: {
                                id: true,
                                name: true,
                                department_code: true,
                            },
                        },
                        classes: {
                            include: {
                                _count: {
                                    select: { students: true },
                                },
                            },
                        },
                    },
                },
                admissionWindow: {
                    select: {
                        program: true,
                    },
                },
            },
            orderBy: {
                startYear: "desc",
            },
        });
        res.json({
            success: true,
            data: batches,
        });
    }
    catch (error) {
        console.error("Error fetching upcoming batches:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch batches",
        });
    }
});
exports.getUpcomingBatches = getUpcomingBatches;
// Assign a single student to a class
const assignStudentToClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId, classId } = req.body;
        if (!studentId || !classId) {
            return res.status(400).json({
                success: false,
                error: "Student ID and Class ID are required",
            });
        }
        // Get the class with its department info
        const classInfo = yield prisma_1.prisma.class.findUnique({
            where: { id: parseInt(classId) },
            include: {
                batchDepartment: {
                    include: {
                        department: true,
                    },
                },
            },
        });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }
        // Update the student
        const updatedStudent = yield prisma_1.prisma.student.update({
            where: { id: parseInt(studentId) },
            data: {
                classId: parseInt(classId),
                departmentId: classInfo.batchDepartment.departmentId,
            },
            include: {
                class: true,
                department: true,
            },
        });
        res.json({
            success: true,
            message: `Student assigned to ${classInfo.name} successfully`,
            data: updatedStudent,
        });
    }
    catch (error) {
        console.error("Error assigning student to class:", error);
        if (error.code === "P2025") {
            return res.status(404).json({
                success: false,
                error: "Student not found",
            });
        }
        res.status(500).json({
            success: false,
            error: "Failed to assign student to class",
        });
    }
});
exports.assignStudentToClass = assignStudentToClass;
// Bulk assign students to classes (auto-distribute)
const autoAssignStudentsToClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentIds, batchDepartmentId } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Student IDs array is required",
            });
        }
        if (!batchDepartmentId) {
            return res.status(400).json({
                success: false,
                error: "Batch Department ID is required",
            });
        }
        // Get the classes for this batch department
        const batchDepartment = yield prisma_1.prisma.batchDepartment.findUnique({
            where: { id: parseInt(batchDepartmentId) },
            include: {
                department: true,
                classes: {
                    include: {
                        _count: {
                            select: { students: true },
                        },
                    },
                },
            },
        });
        if (!batchDepartment) {
            return res.status(404).json({
                success: false,
                error: "Batch department not found",
            });
        }
        if (batchDepartment.classes.length === 0) {
            return res.status(400).json({
                success: false,
                error: `No classes found for department ${batchDepartment.department.name}. Please create classes first in the Manage Classes section.`,
            });
        }
        // Sort classes by current student count (ascending) for balanced distribution
        const sortedClasses = batchDepartment.classes.sort((a, b) => a._count.students - b._count.students);
        // Distribute students evenly across classes
        const assignments = [];
        let classIndex = 0;
        const numClasses = sortedClasses.length;
        for (const studentId of studentIds) {
            const targetClass = sortedClasses[classIndex % numClasses];
            assignments.push({
                studentId: parseInt(studentId),
                classId: targetClass.id,
            });
            classIndex++;
        }
        // Perform the assignments in a transaction
        yield prisma_1.prisma.$transaction(assignments.map((assignment) => prisma_1.prisma.student.update({
            where: { id: assignment.studentId },
            data: {
                classId: assignment.classId,
                departmentId: batchDepartment.departmentId,
            },
        })));
        res.json({
            success: true,
            message: `${studentIds.length} students assigned to ${batchDepartment.department.name} classes successfully`,
            assignedCount: studentIds.length,
        });
    }
    catch (error) {
        console.error("Error auto-assigning students:", error);
        res.status(500).json({
            success: false,
            error: "Failed to auto-assign students to classes",
        });
    }
});
exports.autoAssignStudentsToClasses = autoAssignStudentsToClasses;
// Bulk assign students to a specific class
const bulkAssignToClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentIds, classId } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Student IDs array is required",
            });
        }
        if (!classId) {
            return res.status(400).json({
                success: false,
                error: "Class ID is required",
            });
        }
        // Get the class with its department info
        const classInfo = yield prisma_1.prisma.class.findUnique({
            where: { id: parseInt(classId) },
            include: {
                batchDepartment: {
                    include: {
                        department: true,
                    },
                },
            },
        });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                error: "Class not found",
            });
        }
        // Update all students
        yield prisma_1.prisma.student.updateMany({
            where: {
                id: { in: studentIds.map((id) => parseInt(id)) },
            },
            data: {
                classId: parseInt(classId),
                departmentId: classInfo.batchDepartment.departmentId,
            },
        });
        res.json({
            success: true,
            message: `${studentIds.length} students assigned to ${classInfo.name} successfully`,
        });
    }
    catch (error) {
        console.error("Error bulk assigning students:", error);
        res.status(500).json({
            success: false,
            error: "Failed to assign students to class",
        });
    }
});
exports.bulkAssignToClass = bulkAssignToClass;
