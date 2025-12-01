from dataclasses import dataclass
from typing import Any
from matcher.context import Context
from matcher.providers.session import HasSession


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
class WikidataProvider(HasSession):
    async def get_resource_relations(self, wikidata_id):
        try:
            session = await self.get_session()
            async with session.get(
                f"https://wikidata.org/w/rest.php/wikibase/v1/entities/items/{wikidata_id}",
                headers={
                    "User-Agent": f"Meelo (Matcher), {Context.get().settings.version}",
                },
            ) as response:
                return WikidataRelations(await response.json())
        except Exception:
            return None
