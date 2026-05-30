import { IsString, IsIn } from "class-validator";

export class CreateReactionDto {
  @IsIn(["post", "comment"])
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsIn(["like", "dislike"])
  type!: string;
}
