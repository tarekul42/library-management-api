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
exports.bookController = void 0;
const book_model_1 = __importDefault(require("./book.model"));
const createBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield book_model_1.default.create(req.body);
        res.status(201).json({
            success: true,
            message: "Book created successfully",
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
const getBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filter, sortBy, sort, limit = "10" } = req.query;
        // filtering
        const query = {};
        if (filter) {
            query.genre = filter;
        }
        //sorting
        const sortOrder = sort === "asc" ? 1 : -1;
        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder;
        }
        // limit
        const limitNumber = parseInt(limit, 10);
        const finalLimit = isNaN(limitNumber) || limitNumber <= 0 ? 10 : limitNumber;
        const data = yield book_model_1.default.find(query).sort(sortOptions).limit(finalLimit);
        res.status(200).json({
            success: true,
            message: "Books retrieved successfully",
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
const getBookById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookId = req.params.bookId;
        const data = yield book_model_1.default.findById(bookId);
        if (!data) {
            res.status(404).json({
                success: false,
                message: "Book not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Book retrieved successfully",
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
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookId = req.params.bookId;
        const updatedBody = req.body;
        const data = yield book_model_1.default.findByIdAndUpdate(bookId, updatedBody, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            message: "Book updated successfully",
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
const deleteBookById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookId = req.params.bookId;
        const data = yield book_model_1.default.findByIdAndDelete(bookId);
        res.status(200).json({
            success: true,
            message: "Book deleted successfully",
            data: null,
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
exports.bookController = {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBookById,
};
