import { Module } from "@nestjs/common";
import PrismaModule from "src/prisma/prisma.module";
import MigrationService from "./migration.service";

@Module({
	imports: [PrismaModule],
	providers: [MigrationService],
	exports: [],
})
export default class MigrationModule {}
