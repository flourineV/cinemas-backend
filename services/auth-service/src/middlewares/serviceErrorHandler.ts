//   import { Request, Response, NextFunction } from "express";

//     Type of error service
//   export enum ServiceErrorType {
//     USER_NOT_FOUND = "USER_NOT_FOUND",
//     INVALID_PASSWORD = "INVALID_PASSWORD",
//     EMAIL_EXISTS = "EMAIL_EXISTS",
//     USERNAME_EXISTS = "USERNAME_EXISTS",
//     PHONE_EXISTS = "PHONE_EXISTS",
//     NATIONAL_ID_EXISTS = "NATIONAL_ID_EXISTS",
//     INVALID_TOKEN = "INVALID_TOKEN",
//     INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
//     INVALID_EMAIL = "INVALID_EMAIL",
//   }

//     Error class for service
//   export class ServiceError extends Error {
//     constructor(
//       public type: ServiceErrorType,
//       public statusCode: number = 400
//     ) {
//       super();
//       this.name = "ServiceError";
//     }
//   }

//     Map error type to message for display
//   const errorMessages = {
//     [ServiceErrorType.USER_NOT_FOUND]: "Not found user",
//     [ServiceErrorType.INVALID_PASSWORD]: "Invalid password",
//     [ServiceErrorType.EMAIL_EXISTS]: "Email already exists",
//     [ServiceErrorType.USERNAME_EXISTS]: "Username already exists",
//     [ServiceErrorType.PHONE_EXISTS]: "Phone number already exists",
//     [ServiceErrorType.NATIONAL_ID_EXISTS]: "National ID already exists",
//     [ServiceErrorType.INVALID_TOKEN]: "Invalid token",
//     [ServiceErrorType.INVALID_REFRESH_TOKEN]: "Invalid refresh token",
//     [ServiceErrorType.INVALID_EMAIL]: "Invalid email format",
//   };

//     Middleware execute error
//   export const serviceErrorHandler = (
//     err: Error,
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) => {
//       Error from service
//     if (err instanceof ServiceError) {
//       return res.status(err.statusCode).json({
//         success: false,
//         message: errorMessages[err.type],
//         error: err.type,
//       });
//     }

//       If not a service error, pass to general error handler
//     next(err);
//   };
