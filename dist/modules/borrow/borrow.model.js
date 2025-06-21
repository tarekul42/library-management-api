"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const borrowSchema = new mongoose_1.Schema({
    book: { type: mongoose_1.Schema.Types.ObjectId },
    quantity: { type: Number, min: 1, required: true },
    dueDate: { type: Date, required: true },
}, {
    versionKey: false,
    timestamps: true,
});
const Borrow = (0, mongoose_1.model)("Borrow", borrowSchema);
exports.default = Borrow;
