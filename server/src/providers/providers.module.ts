import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
	imports: [HttpModule],
})
export default class ProvidersModule {}
