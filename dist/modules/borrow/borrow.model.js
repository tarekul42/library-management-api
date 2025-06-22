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
// pre-save middlwware: runs before saving a borrow record
borrowSchema.pre("save", function (next) {
    console.log(`About to save borrow record for book ID: ${this.book}`);
    next();
});
// post-save middleware: runs after saving a borrow record
borrowSchema.post("save", function (doc) {
    console.log(`Borrow record saved successfully for book ID: ${doc._id}`);
});
const Borrow = (0, mongoose_1.model)("Borrow", borrowSchema);
exports.default = Borrow;
