import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class StatusResponse(BaseModel):
    message: str
    version: str


@router.get("/", tags=["Endpoints"])
async def status() -> StatusResponse:
    buildVersion = os.environ["VERSION"] or "unknown"
    return StatusResponse(message="Matcher is alive.", version=buildVersion)
