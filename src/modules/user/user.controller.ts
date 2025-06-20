import { Request, Response } from "express";
import User from "./user.model";

const registerUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const user = new User(payload);

    const data = await user.save();
    res.status(201).json({
      success: true,
      message: "User registered successfully",
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

const getUsers = async (req: Request, res: Response) => {
  const data = await User.find();

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data,
  });
};

export const userController = {
  registerUser,
  getUsers,
};
