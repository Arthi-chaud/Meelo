import { Module } from "@nestjs/common";
import GenreModule from "src/genre/genre.module";
import LabelModule from "src/label/label.module";
import PrismaModule from "src/prisma/prisma.module";
import MigrationService from "./migration.service";

@Module({
	imports: [PrismaModule, LabelModule, GenreModule],
	providers: [MigrationService],
	exports: [],
})
export default class MigrationModule {}
