import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import ProviderService from './provider.service';
import SettingsModule from 'src/settings/settings.module';
import GeniusProvider from './genius/genius.provider';
import MusicBrainzProvider from './musicbrainz/musicbrainz.provider';
import PrismaModule from 'src/prisma/prisma.module';
import { ExternalIdResponseBuilder } from './models/external-id.response';
import ExternalIdService from './external-id.provider';
import ProvidersIllustrationService from './provider-illustration.service';
import IllustrationModule from 'src/illustration/illustration.module';

@Module({
	imports: [
		HttpModule,
		SettingsModule,
		PrismaModule,
		forwardRef(() => IllustrationModule)
	],
	providers: [
		GeniusProvider,
		MusicBrainzProvider,
		ProviderService,
		ProvidersIllustrationService,
		ExternalIdService,
		ExternalIdResponseBuilder
	],
	exports: [
		ProviderService,
		ProvidersIllustrationService,
		ExternalIdService,
		ExternalIdResponseBuilder
	]
})
export default class ProvidersModule {}
