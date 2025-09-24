import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  private static authService = new AuthService();

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy dữ liệu từ request body
      const { email, username, password, phoneNumber, nationalId } = req.body;

      // Gọi service để xử lý logic
      const user = await AuthController.authService.register({
        email,
        username,
        password,
        phoneNumber,
        nationalId,
      });

      // Trả về response thành công
      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          phoneNumber: user.phoneNumber,
          nationalId: user.nationalId,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      // Chuyển lỗi cho middleware xử lý
      next(error);
    }
  }

  // Chuẩn bị cho login API
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      // TODO: Implement login logic
      res.status(200).json({
        success: true,
        message: "API đang được phát triển",
      });
    } catch (error) {
      next(error);
    }
  }
}
