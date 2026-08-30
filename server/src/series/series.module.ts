import { forwardRef, Module } from "@nestjs/common";
import AlbumModule from "src/album/album.module";
import { EventsModule } from "src/events/events.module";
import LabelModule from "src/label/label.module";
import PrismaModule from "src/prisma/prisma.module";
import SeriesController from "./series.controller";
import { SeriesService } from "./series.service";

@Module({
	controllers: [SeriesController],
	providers: [SeriesService],
	imports: [
		PrismaModule,
		LabelModule,
		EventsModule,
		forwardRef(() => AlbumModule),
	],
	exports: [SeriesService],
})
export class SeriesModule {}
