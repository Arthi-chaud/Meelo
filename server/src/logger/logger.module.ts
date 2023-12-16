import { Module } from "@nestjs/common";
import Logger from "./logger";

@Module({
	imports: [],
	providers: [Logger],
	exports: [Logger],
})
export default class LoggerModule {}
