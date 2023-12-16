import { Module } from "@nestjs/common";
import PrismaService from "./prisma.service";

@Module({
	providers: [PrismaService],
	exports: [PrismaService],
})
export default class PrismaModule {}
