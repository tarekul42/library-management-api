import { Request, Response } from "express";
import Borrow from "./borrow.model";
import Book from "../book/book.model";

const createBorrow = async (req: Request, res: Response): Promise<void> => {
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
    if (
      typeof quantity !== "number" ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
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
    const book = await Book.findById(bookId);
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
    await book.updateAvailability();

    // create a borrow record
    const data = await Borrow.create({
      book: book._id,
      quantity,
      dueDate: due,
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
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

const getBorrow = async (req: Request, res: Response) => {
  try {
    const data = await Borrow.aggregate([
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Validation failed",
      error,
    });
  }
};

export const borrowController = {
  createBorrow,
  getBorrow,
};


