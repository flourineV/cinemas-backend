import { UserModel } from "../models/User";

export class UserRepository {
  static async create(user: any) {
    return await UserModel.create(user);
  }

  static async findByEmail(email: string) {
    return await UserModel.findOne({ email });
  }

  static async findById(id: string) {
    return await UserModel.findById(id);
  }
}
