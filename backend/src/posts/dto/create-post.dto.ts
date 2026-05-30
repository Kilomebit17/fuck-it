import { IsString, Length } from "class-validator";

export class CreatePostDto {
  @IsString()
  @Length(1, 10000)
  content!: string;
}
