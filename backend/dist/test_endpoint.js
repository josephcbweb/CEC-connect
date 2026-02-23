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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// fetch is global
const secret = 'MAYYEHC;ETAERCMULENEV;HTNE';
const payload = { userId: 837, username: "ANANTHU S NAIR" }; // ID found in debug check
const token = jsonwebtoken_1.default.sign(payload, secret);
console.log("Testing with Token:", token);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch("http://localhost:3000/students/all?include=department,invoices", {
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
            console.log("Error:", res.status, res.statusText);
            const text = yield res.text();
            console.log(text);
            return;
        }
        const json = yield res.json();
        console.log("Check Result:", JSON.stringify(json, null, 2));
    });
}
run();
