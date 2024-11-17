import logging
from typing import List

from matcher.models.api.dto import ExternalMetadataSourceDto
from ..context import Context
from ..providers.musicbrainz import MusicBrainzProvider


def match_artist(artist_id: int, artist_name: str):
	context = Context.get()
	mb_provider = context.get_provider(MusicBrainzProvider)
	artist_illustration_url: str | None = None
	external_sources: List[ExternalMetadataSourceDto] = []
	description: str | None = None
	if mb_provider:
		mbEntry = mb_provider.search_artist(artist_name)
		if mbEntry:
			external_sources.append(
				ExternalMetadataSourceDto(mb_provider.build_artist_url(mbEntry.id),
				mb_provider.api_model.id))
			for rel in mb_provider.get_artist(mbEntry.id)['artist']['url-relation-list']:
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
	
	logging.info(artist_illustration_url)
	logging.info(external_sources)