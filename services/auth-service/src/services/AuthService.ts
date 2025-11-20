// src/services/AuthService.ts
import { SignUpRequest } from "../dtos/request/SignUpRequest";
import { SignInRequest } from "../dtos/request/SignInRequest";
import { JwtResponse } from "../dtos/response/JwtResponse";
import { UserResponse } from "../dtos/response/UserResponse";
import { UserRepository } from "../repositories/UserRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { RefreshTokenService } from "./RefreshTokenService";
import { JWT } from "../config/JWT";
import bcrypt from "bcrypt";

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private refreshTokenService: RefreshTokenService;
  private jwtUtil: JWT;

  constructor(
    userRepository: UserRepository,
    roleRepository: RoleRepository,
    refreshTokenService: RefreshTokenService,
    jwtUtil: JWT
  ) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.refreshTokenService = refreshTokenService;
    this.jwtUtil = jwtUtil;
  }

  // đăng ký
  async signUp(request: SignUpRequest): Promise<JwtResponse> {
    if (request.password !== request.confirmPassword) {
      throw new Error("Password and confirm password do not match!");
    }

    if (await this.userRepository.existsByEmail(request.email)) {
      throw new Error("Email is already taken!");
    }
    if (await this.userRepository.existsByUsername(request.username)) {
      throw new Error("Username is already taken!");
    }
    if (await this.userRepository.existsByPhoneNumber(request.phoneNumber)) {
      throw new Error("Phone number is already taken!");
    }
    if (await this.userRepository.existsByNationalId(request.nationalId)) {
      throw new Error("National ID is already taken!");
    }

    const defaultRole = await this.roleRepository.findByName("customer");
    if (!defaultRole) {
      throw new Error("Default role not found");
    }

    const passwordHash = await bcrypt.hash(request.password, 10);

    const user = await this.userRepository.save({
      email: request.email,
      username: request.username,
      phoneNumber: request.phoneNumber,
      nationalId: request.nationalId,
      passwordHash,
      role: defaultRole,
    });

    const accessToken = this.jwtUtil.generateAccessToken(
      user.id,
      user.role.name
    );
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);

    return new JwtResponse(
      accessToken,
      refreshToken.token,
      "Bearer",
      UserResponse.fromEntity(user)
    );
  }

  // đăng nhập
  async signIn(request: SignInRequest): Promise<JwtResponse> {
    const user = await this.userRepository.findByEmailOrUsernameOrPhoneNumber(
      request.usernameOrEmailOrPhone
    );
    if (!user) {
      throw new Error("User not found");
    }

    const validPassword = await bcrypt.compare(
      request.password,
      user.passwordHash
    );
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    if (user.status?.toUpperCase() === "BANNED") {
      throw new Error("Account disabled");
    }

    const accessToken = this.jwtUtil.generateAccessToken(
      user.id,
      user.role.name
    );
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);

    return new JwtResponse(
      accessToken,
      refreshToken.token,
      "Bearer",
      UserResponse.fromEntity(user)
    );
  }

  // đăng xuất
  async signOut(refreshTokenString: string): Promise<void> {
    await this.refreshTokenService.deleteByToken(refreshTokenString);
  }
}
