from ..models.api.provider import Provider as ApiProviderEntry
from dataclasses import dataclass


@dataclass
class BaseProvider:
    api_model: ApiProviderEntry
