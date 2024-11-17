import logging
from typing import List

from matcher.models.api.dto import ExternalMetadataDto, ExternalMetadataSourceDto
from ..context import Context
from ..providers.musicbrainz import MusicBrainzProvider

def match_and_post_artist(artist_id: int, artist_name: str):
	try:
		(dto, illustration_url) = match_artist(artist_id, artist_name)
		context = Context.get()
		if dto:
			context.client.post_external_metadata(dto)
		if illustration_url:
			context.client.post_artist_illustration(artist_id, illustration_url)
	except Exception as e:
		logging.error(e)
		

def match_artist(artist_id: int, artist_name: str) -> tuple[ExternalMetadataDto | None, str | None]:
	context = Context.get()
	mb_provider = context.get_provider(MusicBrainzProvider)
	artist_illustration_url: str | None = None
	external_sources: List[ExternalMetadataSourceDto] = []
	description: str | None = None
	wikidata_id: str | None = None
	if mb_provider:
		mbEntry = mb_provider.search_artist(artist_name)
		if mbEntry:
			external_sources.append(
				ExternalMetadataSourceDto(mb_provider.build_artist_url(mbEntry.id),
				mb_provider.api_model.id))
			for rel in mb_provider.get_artist(mbEntry.id)['artist']['url-relation-list']:
				if rel['type'] == 'wikidata':
					wikidata_id = rel['target'].replace('https://www.wikidata.org/wiki/', '')
					continue
				providers = [
					p for p in context.providers 
			   		if p.get_musicbrainz_relation_key() == rel['type']
						or p.is_musicbrainz_relation(rel)
					]
				if not len(providers):
					continue
				provider = providers[0]
				provider_id = provider.api_model.id
				if not [previous_match for previous_match in external_sources if previous_match.provider_id == provider_id]:
					external_sources.append(ExternalMetadataSourceDto(rel['target'], provider_id))
	## TODO Resolve Ids for providers using WIKIDATA
	## TODO Resolving Ids for providers that were not linked in MB
	# sources_ids = [source.provider_id for source in external_sources]
	# for provider in [p for p in context.providers if p.api_model.id not in sources_ids]:
	# 	logging.info("Missing provider: " + provider.api_model.name)
	for source in external_sources:
		provider = get_provider_from_external_source(source)
		if description and artist_illustration_url:
			break
		provider_artist_id = provider.get_artist_id_from_url(source.url)
		if not provider_artist_id:
			continue
		artist = provider.get_artist(provider_artist_id)
		if not artist:
			continue
		if not description:
			description = provider.get_artist_description(artist, source.url)
		if not artist_illustration_url:
			artist_illustration_url = provider.get_artist_illustration_url(artist, source.url)
	return (ExternalMetadataDto(
		description,
		artist_id=artist_id,
		rating=None,
		album_id=None,
		song_id=None,
		sources=external_sources
		), artist_illustration_url)

def get_provider_from_external_source(dto: ExternalMetadataSourceDto):
	return [p for p in Context.get().providers if p.api_model.id == dto.provider_id][0]