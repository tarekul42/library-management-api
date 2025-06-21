"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bookSchema = new mongoose_1.Schema({
    title: { type: String, trim: true, required: true },
    author: { type: String, trim: true, required: true },
    genre: {
        type: String,
        required: true,
        enum: [
            "FICTION",
            "NON_FICTION",
            "SCIENCE",
            "HISTORY",
            "BIOGRAPHY",
            "FANTASY",
        ],
    },
    isbn: { type: String, trim: true, required: true, unique: true },
    description: { type: String },
    copies: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
}, {
    versionKey: false,
    timestamps: true,
});
// pre-save hook to update the 'available' field field based on 'copies' data
bookSchema.pre("save", function (next) {
    if (this.copies === 0) {
        this.available = false;
    }
    else {
        this.available = true;
    }
    next();
});
// Add this pre-findOneAndUpdate hook to update the value of field "available"
bookSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update && update.copies !== undefined) {
        update.available = update.copies === 0 ? false : true;
        this.setUpdate(update);
    }
    next();
});
const Book = (0, mongoose_1.model)("Book", bookSchema);
exports.default = Book;
