from aiohttp import ClientSession
import aiohttp


class HasSession:
    _session: ClientSession | None = None

    async def reset_session(self):
        if self._session:
            await self._session.close()
            self._session = None

    async def get_session(self) -> ClientSession:
        if self._session and self._session.closed:
            await self._session.close()
            self._session = None
        if not self._session:
            self._session = aiohttp.ClientSession()

        return self._session
