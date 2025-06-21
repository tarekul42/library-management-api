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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("./modules/routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(routes_1.default);
app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to Library Management Server!",
    });
});
// universal 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        error: {
            code: 404,
            description: "The requested endpoint does not exist.",
        },
    });
    next();
});
// global error handler
app.use((error, req, res, next) => {
    if (error) {
        console.log("Error", error);
        res
            .status(400)
            .json({ message: "Something went wrong from global error", error });
    }
    next();
});
function server() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(config_1.default.database_url);
            console.log("Database connected successfully");
            app.listen(config_1.default.port, () => {
                console.log(`Library management API is running on port: ${config_1.default.port}`);
            });
        }
        catch (error) {
            console.error(`Library management API got error: ${error}`);
        }
    });
}
server();
