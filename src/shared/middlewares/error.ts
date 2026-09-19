import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(
    statusCode: number,
    error: string,
    message: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.error,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "서버 내부 오류가 발생했습니다.",
  });
};
