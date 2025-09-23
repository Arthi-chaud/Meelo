from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["Endpoints"])
def hello_world():
    return '{"message": "Hello World"}'
