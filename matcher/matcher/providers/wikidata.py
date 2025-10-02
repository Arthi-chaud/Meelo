from dataclasses import dataclass
from typing import Any
import requests
from matcher.context import Context


@dataclass
class WikidataRelations:
    _data: Any

    # Parameter is sth like P110000
    def get_identifier_from_provider_using_relation_key(self, relation_key: str):
        try:
            return self._data["statements"][relation_key][0]["value"]["content"]
        except Exception:
            return None


# Note: Not a regular provider, we use it to link with other providers
@dataclass
class WikidataProvider:
    def get_resource_relations(self, wikidata_id):
        try:
            return WikidataRelations(
                requests.get(
                    f"https://wikidata.org/w/rest.php/wikibase/v1/entities/items/{wikidata_id}",
                    headers={
                        "User-Agent": f"Meelo (Matcher), {Context.get().settings.version}",
                    },
                ).json()
            )
        except Exception:
            return None
