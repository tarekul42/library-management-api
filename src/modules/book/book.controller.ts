import { Request, Response } from "express";
import Book from "./book.model";
import { GetBookQuery } from "./book.interface";

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
      message: "Validation failed",
      error,
    });
  }
};

const getBooks = async (req: Request, res: Response) => {
  try {
    const { filter, sortBy, sort, limit = "10" } = req.query as GetBookQuery;

    // filtering
    const query: any = {};
    if (filter) {
      query.genre = filter;
    }

    //sorting
    const sortOrder = sort === "asc" ? 1 : -1;
    const sortOptions: any = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder;
    }

    // limit
    const limitNumber = parseInt(limit, 10);
    const finalLimit =
      isNaN(limitNumber) || limitNumber <= 0 ? 10 : limitNumber;

    const data = await Book.find(query).sort(sortOptions).limit(finalLimit);

    res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Validation failed",
      error,
    });
  }
};

export const bookController = {
  createBook,
  getBooks,
};
