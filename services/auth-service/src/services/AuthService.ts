import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository";

export class AuthService {
  static async register(data: any) {
    const hashed = await bcrypt.hash(data.password, 10);
    return UserRepository.create({ ...data, password: hashed });
  }

  static async login(data: any) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    return { user, token };
  }
}
