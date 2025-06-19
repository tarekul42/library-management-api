import { Request, Response } from "express";
import Book from "./book.model";

const createBook = async (req: Request, res: Response) => {
  try {

    const data = await Book.create(req.body);

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create book",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const bookController = {
  createBook,
};
