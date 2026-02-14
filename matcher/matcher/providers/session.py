from abc import abstractmethod
from aiohttp import ClientSession


class HasSession:
    _session: ClientSession | None = None

    @abstractmethod
    def mk_session(self) -> ClientSession:
        raise NotImplementedError

    # For testing purposes
    async def reset_session(self):
        if self._session:
            await self._session.close()
            self._session = None

    def get_session(self) -> ClientSession:
        if self._session and self._session.closed:
            self._session = None
        if not self._session:
            self._session = self.mk_session()

        return self._session
