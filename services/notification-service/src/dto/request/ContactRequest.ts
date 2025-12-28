import { IsEmail, IsNotEmpty, Length } from "class-validator";

export class ContactRequest {
  @IsNotEmpty({ message: "Name is required" })
  @Length(2, 100, { message: "Name must be between 2 and 100 characters" })
  name!: string;

  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsNotEmpty({ message: "Message is required" })
  @Length(10, 1000, { message: "Message must be between 10 and 1000 characters" })
  message!: string;
}
