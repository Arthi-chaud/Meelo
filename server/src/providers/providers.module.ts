import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import MusixMatchProvider from './musixmatch/musixmatch.provider';
import ProviderService from './provider.service';
import SettingsModule from 'src/settings/settings.module';
import GeniusProvider from './genius/genius.provider';
import MusicBrainzProvider from './musicbrainz/musicbrainz.provider';

@Module({
	imports: [HttpModule, SettingsModule],
	providers: [GeniusProvider, MusicBrainzProvider, MusixMatchProvider, ProviderService],
	exports: [ProviderService]
})
export default class ProvidersModule {}
