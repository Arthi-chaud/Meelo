import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import MusixMatchProvider from './musixmatch/musixmatch.provider';
import ProviderService from './provider.service';
import SettingsModule from 'src/settings/settings.module';
import GeniusProvider from './genius/genius.provider';

@Module({
	imports: [HttpModule, SettingsModule],
	providers: [GeniusProvider, MusixMatchProvider, ProviderService],
	exports: [ProviderService]
})
export default class ProvidersModule {}
