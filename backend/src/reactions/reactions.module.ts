import { Module } from "@nestjs/common";
import { ReactionsController } from "./reactions.controller";
import { ReactionsService } from "./reactions.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
