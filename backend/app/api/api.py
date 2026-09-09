from fastapi import APIRouter
from app.api.endpoints import auth, users, products, receipts, scores, assistant, shopping, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(scores.router, prefix="/scores", tags=["scores"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
api_router.include_router(shopping.router, prefix="/shopping", tags=["shopping"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
