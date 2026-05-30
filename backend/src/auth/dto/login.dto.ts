import { IsString, Length, Matches } from "class-validator";

export class LoginDto {
  @Matches(/^\d{6}$/, { message: "anonymousId must be exactly 6 digits" })
  anonymousId!: string;

  @IsString()
  @Length(4, 100)
  password!: string;
}
