import { Module } from "@nestjs/common";
import LabelModule from "src/label/label.module";
import PrismaModule from "src/prisma/prisma.module";
import MigrationService from "./migration.service";

@Module({
	imports: [PrismaModule, LabelModule],
	providers: [MigrationService],
	exports: [],
})
export default class MigrationModule {}
