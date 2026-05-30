import { IsString, Length, IsOptional } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @Length(1, 2000)
  content!: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
