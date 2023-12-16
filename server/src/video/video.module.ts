import { Module } from "@nestjs/common";
import { VideoController } from "./video.controller";
import SongModule from "src/song/song.module";
import { VideoResponseBuilder } from "./models/video.response";
import VideoService from "./video.service";
import TrackModule from "src/track/track.module";
import PrismaModule from "src/prisma/prisma.module";

@Module({
	imports: [SongModule, TrackModule, PrismaModule],
	controllers: [VideoController],
	exports: [VideoResponseBuilder],
	providers: [VideoResponseBuilder, VideoService],
})
export default class VideoModule {}
