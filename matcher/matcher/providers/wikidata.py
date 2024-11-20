from dataclasses import dataclass
from typing import Any
import requests

@dataclass
class WikidataRelations:
	_data: Any
	# Parameter is sth like P110000
	def get_identifier_from_provider_using_relation_key(self, relation_key: str):
		try:
			return self._data['statements'][relation_key][0]['value']['content']
		except:
			return None

# Note: Not a regular provider, we use it to link with other providers
@dataclass
class WikidataProvider:
	def get_resource_relations(self, wikidata_id):
		try:
			return WikidataRelations(requests.post(
				f"https://wikidata.org/w/rest.php/wikibase/v0/entities/items/{wikidata_id}"
			).json())
		except:
			return None