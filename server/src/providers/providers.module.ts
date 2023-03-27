import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import MusixMatchProvider from './musixmatch/musixmatch.provider';
import ProviderService from './provider.service';
import SettingsModule from 'src/settings/settings.module';
import GeniusProvider from './genius/genius.provider';
import MusicBrainzProvider from './musicbrainz/musicbrainz.provider';
import PrismaModule from 'src/prisma/prisma.module';
import { ExternalIdResponseBuilder } from './models/external-id.response';
import ExternalIdService from './external-id.provider';

@Module({
	imports: [HttpModule, SettingsModule, PrismaModule],
	providers: [
		GeniusProvider,
		MusicBrainzProvider,
		MusixMatchProvider,
		ProviderService,
		ExternalIdService,
		ExternalIdResponseBuilder
	],
	exports: [ProviderService, ExternalIdService, ExternalIdResponseBuilder]
})
export default class ProvidersModule {}
