import { Request, Response, NextFunction } from "express";

// Các loại lỗi từ service
export enum ServiceErrorType {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  EMAIL_EXISTS = "EMAIL_EXISTS",
  USERNAME_EXISTS = "USERNAME_EXISTS",
  PHONE_EXISTS = "PHONE_EXISTS",
  NATIONAL_ID_EXISTS = "NATIONAL_ID_EXISTS"
}

// Class lỗi cho service
export class ServiceError extends Error {
  constructor(
    public type: ServiceErrorType,
    public statusCode: number = 400
  ) {
    super();
    this.name = "ServiceError";
  }
}

// Map lỗi sang message để hiển thị
const errorMessages = {
  [ServiceErrorType.USER_NOT_FOUND]: "Không tìm thấy người dùng",
  [ServiceErrorType.INVALID_PASSWORD]: "Mật khẩu không chính xác",
  [ServiceErrorType.EMAIL_EXISTS]: "Email đã tồn tại",
  [ServiceErrorType.USERNAME_EXISTS]: "Tên đăng nhập đã tồn tại",
  [ServiceErrorType.PHONE_EXISTS]: "Số điện thoại đã tồn tại",
  [ServiceErrorType.NATIONAL_ID_EXISTS]: "CMND/CCCD đã tồn tại"
};

// Middleware xử lý lỗi service
export const serviceErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Nếu là lỗi từ service
  if (err instanceof ServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      message: errorMessages[err.type],
      error: err.type
    });
  }

  // Nếu không phải lỗi service thì chuyển cho errorHandler chung xử lý
  next(err);
};