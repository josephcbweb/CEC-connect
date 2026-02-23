"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const homeRoutes_1 = __importDefault(require("./routes/homeRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const feeRoutes_1 = __importDefault(require("./routes/feeRoutes"));
const certificateRoutes_1 = __importDefault(require("./routes/certificateRoutes"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
const admissionRoutes_1 = __importDefault(require("./routes/admissionRoutes"));
const busRoutes_1 = __importDefault(require("./routes/busRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const noDueRoutes_1 = __importDefault(require("./routes/noDueRoutes"));
const staffRoutes_1 = __importDefault(require("./routes/staffRoutes"));
const batchRoutes_1 = __importDefault(require("./routes/batchRoutes"));
const promotionRoutes_1 = __importDefault(require("./routes/promotionRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const hostelRoutes_1 = __importDefault(require("./routes/hostelRoutes"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/", homeRoutes_1.default);
app.use("/admin", adminRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/roles", roleRoutes_1.default);
app.use("/api/permissions", permissionRoutes_1.default);
app.use("/admin", adminRoutes_1.default);
app.use("/students", studentRoutes_1.default);
app.use("/fee", feeRoutes_1.default);
app.use("/api/certificates", certificateRoutes_1.default);
app.use("/auth", authRouter_1.default);
app.use("/api/departments", departmentRoutes_1.default);
app.use("/api/admission", admissionRoutes_1.default);
app.use("/bus", busRoutes_1.default);
app.use("/settings", settingsRoutes_1.default);
app.use("/api/courses", courseRoutes_1.default);
app.use("/api/nodue", noDueRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/staff", staffRoutes_1.default);
app.use("/api/promotion", promotionRoutes_1.default);
app.use("/api", batchRoutes_1.default);
app.use("/api/hostel", hostelRoutes_1.default);
const cronService_1 = require("./services/cronService");
(0, cronService_1.initCronJobs)();
app.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});
