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
exports.borrowController = void 0;
const borrow_model_1 = __importDefault(require("./borrow.model"));
const book_model_1 = __importDefault(require("../book/book.model"));
const createBorrow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { book: bookId, quantity, dueDate } = req.body;
        // validate required fields
        if (!bookId || quantity === undefined || !dueDate) {
            res.status(400).json({
                success: false,
                message: "Book ID, quantity, and due date are required",
            });
            return;
        }
        // validate quantity
        if (typeof quantity !== "number" ||
            quantity <= 0 ||
            !Number.isInteger(quantity)) {
            res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer",
            });
            return;
        }
        // validate due date
        const due = new Date(dueDate);
        if (isNaN(due.getTime()) || due <= new Date()) {
            res.status(400).json({
                success: false,
                message: "Due date must be a valid date for future",
            });
            return;
        }
        // find the book by ID
        const book = yield book_model_1.default.findById(bookId);
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found",
            });
            return;
        }
        // check "copies" availability
        if (book.copies < quantity) {
            res.status(400).json({
                success: false,
                message: `Only ${book.copies} copies are available!`,
            });
            return;
        }
        book.copies -= quantity;
        yield book.updateAvailability();
        // create a borrow record
        const data = yield borrow_model_1.default.create({
            book: book._id,
            quantity,
            dueDate: due,
        });
        res.status(201).json({
            success: true,
            message: "Book borrowed successfully",
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Validation failed",
            error,
        });
    }
});
const getBorrow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield borrow_model_1.default.aggregate([
            {
                $group: {
                    _id: "$book",
                    totalQuantity: {
                        $sum: "$quantity",
                    },
                },
            },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "bookDetails",
                },
            },
            {
                $unwind: "$bookDetails",
            },
            {
                $project: {
                    _id: 0,
                    book: {
                        title: "$bookDetails.title",
                        isbn: "$bookDetails.isbn",
                    },
                    totalQuantity: 1,
                },
            },
        ]);
        res.status(200).json({
            success: true,
            message: "Borrowed books summary retrieved successfully",
            data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Validation failed",
            error,
        });
    }
});
exports.borrowController = {
    createBorrow,
    getBorrow,
};
