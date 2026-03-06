from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.exception_handlers import http_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import ALLOWED_ORIGINS, FRONTEND_ORIGIN, MAX_UPLOAD_BYTES, UPLOAD_DIR
from .database import db_session
from .models import Recipe, User, init_schema
from .schemas import (
    AuthPayload,
    AuthResponse,
    PasswordResetPayload,
    PublishPayload,
    RecipeCreatePayload,
    RecipePatchPayload,
    RecipeResponse,
)
from .security import create_access_token, decode_access_token, hash_password, verify_password


app = FastAPI(title="Vibe Recipe API", version="1.1.0")
origins = {origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()}
if not origins:
    origins = {FRONTEND_ORIGIN}
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def _now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def _api_error(code: str, message: str, status_code: int = 400) -> None:
    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


def _serialize_recipe(recipe: Recipe) -> dict[str, Any]:
    return {
        "id": recipe.id,
        "user_id": recipe.user_id,
        "title": recipe.title,
        "description": recipe.description,
        "ingredients": recipe.ingredients,
        "steps": recipe.steps,
        "prep_time_min": recipe.prep_time_min,
        "cook_time_min": recipe.cook_time_min,
        "servings": recipe.servings,
        "category": recipe.category,
        "tags": recipe.tags,
        "is_public": bool(recipe.is_public),
        "cover_image_url": recipe.cover_image_url,
        "source_url": recipe.source_url,
        "nutrition": recipe.nutrition,
        "created_at": recipe.created_at.astimezone(datetime.timezone.utc).isoformat(),
        "updated_at": recipe.updated_at.astimezone(datetime.timezone.utc).isoformat(),
    }


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.lower()
    return json.dumps(value, ensure_ascii=False).lower()


def _contains_text(recipe: Recipe, keyword: str) -> bool:
    lowered = keyword.lower()
    fields = [
        _safe_text(recipe.title),
        _safe_text(recipe.description),
        _safe_text(recipe.ingredients),
        _safe_text(recipe.steps),
    ]
    return any(lowered in field for field in fields)


def _normalize_order(sort: str, order: str):
    if sort == "title":
        column = Recipe.title
    elif sort == "updated_at":
        column = Recipe.updated_at
    else:
        column = Recipe.created_at
    return column.asc() if order == "asc" else column.desc()


@app.exception_handler(HTTPException)
async def format_http_exception(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail and "message" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    return await http_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def format_validation_error(request: Request, exc: RequestValidationError):  # pragma: no cover
    return JSONResponse(
        status_code=400,
        content={"error": {"code": "INVALID_INPUT", "message": "요청 데이터가 올바르지 않습니다."}},
    )


@app.on_event("startup")
def on_startup() -> None:
    with db_session():
        init_schema()


def _decode_user_id(authorization: Optional[str]) -> Optional[int]:
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    return decode_access_token(token)


def _register_user_sync(email: str, password: str) -> User:
    with db_session():
        if User.get_or_none(User.email == email) is not None:
            _api_error("EMAIL_EXISTS", "이미 사용 중인 이메일입니다.", 409)
        return User.create(email=email, hashed_password=hash_password(password))


def _find_user_sync(user_id: int) -> Optional[User]:
    with db_session():
        return User.get_or_none(User.id == user_id)


def _find_recipe_for_access_sync(recipe_id: int, user: Optional[User]) -> Recipe:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)

        if recipe and not recipe.is_public:
            if user is None:
                _api_error("UNAUTHORIZED", "요청한 레시피에 대한 권한이 없습니다.", 401)
            if recipe.user_id != user.id:
                _api_error("FORBIDDEN", "요청한 레시피에 대한 권한이 없습니다.", 403)
        return recipe


def _login_user_sync(email: str, password: str) -> User:
    with db_session():
        user = User.get_or_none(User.email == email)
        if user is None or not verify_password(password, user.hashed_password):
            _api_error("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", 401)
        return user


def _list_recipes_sync(
    *,
    q: Optional[str],
    sort: str,
    order: str,
    category: Optional[str],
    limit: int,
    offset: int,
    user: Optional[User],
    open_list: bool,
):
    query = Recipe.select().order_by(_normalize_order(sort, order))

    if open_list or user is None:
        query = query.where(Recipe.is_public == True)
    else:
        query = query.where((Recipe.is_public == True) | (Recipe.user == user))

    if category:
        query = query.where(Recipe.category == category)

    rows = list(query)
    if q:
        rows = [row for row in rows if _contains_text(row, q.strip())]

    return rows[offset : offset + limit]


def _list_my_recipes_sync(user: User):
    return list(Recipe.select().where(Recipe.user == user).order_by(Recipe.updated_at.desc()))


def _create_recipe_sync(user: User, payload: RecipeCreatePayload) -> Recipe:
    with db_session():
        if not payload.title.strip():
            _api_error("INVALID_INPUT", "title은 비어 있을 수 없습니다.", 400)
        if not payload.ingredients:
            _api_error("INVALID_INPUT", "ingredients는 최소 1개 이상 필요합니다.", 400)
        if not payload.steps:
            _api_error("INVALID_INPUT", "steps는 최소 1개 이상 필요합니다.", 400)

        recipe = Recipe.create(
            user=user,
            title=payload.title.strip(),
            description=payload.description,
            ingredients=payload.ingredients,
            steps=payload.steps,
            prep_time_min=payload.prep_time_min,
            cook_time_min=payload.cook_time_min,
            servings=payload.servings,
            category=payload.category,
            tags=payload.tags,
            is_public=payload.is_public,
            cover_image_url=payload.cover_image_url,
            source_url=payload.source_url,
            nutrition=payload.nutrition,
            created_at=_now_utc(),
            updated_at=_now_utc(),
        )
        return recipe


def _assert_owned_recipe(recipe: Recipe, user: User) -> None:
    if recipe.user_id != user.id:
        _api_error("FORBIDDEN", "요청한 작업에 대한 권한이 없습니다.", 403)


def _patch_recipe_sync(recipe_id: int, user: User, payload: RecipePatchPayload) -> Recipe:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)
        assert recipe is not None
        _assert_owned_recipe(recipe, user)

        if payload.title is not None and not str(payload.title).strip():
            _api_error("INVALID_INPUT", "title은 비어 있을 수 없습니다.", 400)
        if payload.ingredients is not None and len(payload.ingredients) == 0:
            _api_error("INVALID_INPUT", "ingredients는 최소 1개 이상 필요합니다.", 400)
        if payload.steps is not None and len(payload.steps) == 0:
            _api_error("INVALID_INPUT", "steps는 최소 1개 이상 필요합니다.", 400)

        update_fields = payload.model_dump(exclude_unset=True)
        for key, value in update_fields.items():
            setattr(recipe, key, value)
        recipe.updated_at = _now_utc()
        recipe.save()
        return recipe


def _delete_recipe_sync(recipe_id: int, user: User) -> Optional[str]:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)
        assert recipe is not None
        _assert_owned_recipe(recipe, user)

        cover_url = recipe.cover_image_url
        recipe.delete_instance()
        return cover_url


def _publish_recipe_sync(recipe_id: int, user: User, is_public: bool) -> Recipe:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)
        assert recipe is not None
        _assert_owned_recipe(recipe, user)

        recipe.is_public = is_public
        recipe.updated_at = _now_utc()
        recipe.save()
        return recipe


def _find_owned_recipe_sync(recipe_id: int, user: User) -> Recipe:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)
        assert recipe is not None
        _assert_owned_recipe(recipe, user)
        return recipe


def _apply_cover_sync(recipe_id: int, cover_url: Optional[str]) -> Recipe:
    with db_session():
        recipe = Recipe.get_or_none(Recipe.id == recipe_id)
        if recipe is None:
            _api_error("RECIPE_NOT_FOUND", "요청한 레시피를 찾을 수 없습니다.", 404)
        recipe.cover_image_url = cover_url
        recipe.updated_at = _now_utc()
        recipe.save()
        return recipe


def _delete_account_sync(user: User) -> tuple[int, list[str]]:
    with db_session():
        cover_urls = [
            recipe.cover_image_url
            for recipe in Recipe.select(Recipe.cover_image_url).where(Recipe.user == user).iterator()
        ]
        recipe_count = Recipe.delete().where(Recipe.user == user).execute()
        User.delete_by_id(user.id)
        return int(recipe_count), cover_urls


def _safe_delete_upload(url: Optional[str]) -> None:
    if not url:
        return
    if not url.startswith("/uploads/"):
        return
    filename = Path(url).name
    target = UPLOAD_DIR / filename
    if target.exists():
        target.unlink(missing_ok=True)


async def get_current_user(authorization: Optional[str] = Header(default=None)) -> User:
    user_id = _decode_user_id(authorization)
    if user_id is None:
        _api_error("UNAUTHORIZED", "인증 토큰이 없습니다.", 401)

    user = await run_in_threadpool(_find_user_sync, user_id)
    if user is None:
        _api_error("UNAUTHORIZED", "사용자를 찾을 수 없습니다.", 401)
    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
) -> Optional[User]:
    user_id = _decode_user_id(authorization)
    if user_id is None:
        return None
    return await run_in_threadpool(_find_user_sync, user_id)


def _resolve_sort_param(sort: str) -> str:
    if sort not in {"created_at", "updated_at", "title"}:
        _api_error("INVALID_INPUT", "sort는 created_at, updated_at, title 중 하나여야 합니다.", 400)
    return sort


def _resolve_order_param(order: str) -> str:
    if order not in {"asc", "desc"}:
        _api_error("INVALID_INPUT", "order는 asc 또는 desc여야 합니다.", 400)
    return order


@app.get("/api/health")
def health():
    return {"status": "ok", "time": _now_utc().isoformat()}


@app.post("/api/auth/sign-up", response_model=AuthResponse)
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(payload: AuthPayload):
    user = await run_in_threadpool(_register_user_sync, payload.email, payload.password)
    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user.id, "email": user.email},
    )


@app.post("/api/auth/sign-in", response_model=AuthResponse)
@app.post("/api/auth/login", response_model=AuthResponse)
async def login(payload: AuthPayload):
    user = await run_in_threadpool(_login_user_sync, payload.email, payload.password)
    token = create_access_token(user.id, user.email)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user.id, "email": user.email},
    )


@app.post("/api/auth/sign-out")
async def sign_out():
    return {"success": True}


@app.post("/api/auth/reset-password")
async def reset_password(payload: PasswordResetPayload):
    # 의도한 동작은 Supabase 연동을 전제로 하나, 로컬 JWT 모드에서는 성공 플래그만 반환.
    # 사용자 존재 여부 유출을 막기 위해 요청한 주소가 유효하면 항상 성공 처리.
    with db_session():
        User.get_or_none(User.email == payload.email)
    return {"success": True}


@app.get("/api/recipes/public")
async def list_public_recipes(
    q: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    sort = _resolve_sort_param(sort)
    order = _resolve_order_param(order)
    rows = await run_in_threadpool(
        _list_recipes_sync,
        q=q,
        sort=sort,
        order=order,
        category=category,
        limit=limit,
        offset=offset,
        user=None,
        open_list=True,
    )
    return [_serialize_recipe(row) for row in rows]


@app.get("/api/recipes")
async def list_recipes(
    q: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    limit: Optional[int] = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    open: bool = Query(default=False),
    is_public: Optional[bool] = Query(default=None),
    user: Optional[User] = Depends(get_current_user_optional),
):
    sort = _resolve_sort_param(sort)
    order = _resolve_order_param(order)
    effective_limit = 20 if (open or user is None) else 50
    if limit is not None:
        effective_limit = limit
    rows = await run_in_threadpool(
        _list_recipes_sync,
        q=q,
        sort=sort,
        order=order,
        category=category,
        limit=effective_limit,
        offset=offset,
        user=user,
        open_list=bool(open or is_public is True or user is None),
    )
    return [_serialize_recipe(row) for row in rows]


@app.get("/api/recipes/me", response_model=list[RecipeResponse])
async def list_my_recipes(user: User = Depends(get_current_user)):
    rows = await run_in_threadpool(_list_my_recipes_sync, user)
    return [_serialize_recipe(row) for row in rows]


@app.get("/api/recipes/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: int, user: Optional[User] = Depends(get_current_user_optional)):
    recipe = await run_in_threadpool(_find_recipe_for_access_sync, recipe_id, user)
    return _serialize_recipe(recipe)


@app.post("/api/recipes", response_model=RecipeResponse, status_code=201)
async def create_recipe(payload: RecipeCreatePayload, user: User = Depends(get_current_user)):
    recipe = await run_in_threadpool(_create_recipe_sync, user, payload)
    return _serialize_recipe(recipe)


@app.patch("/api/recipes/{recipe_id}", response_model=RecipeResponse)
async def patch_recipe(
    recipe_id: int, payload: RecipePatchPayload, user: User = Depends(get_current_user)
):
    recipe = await run_in_threadpool(_patch_recipe_sync, recipe_id, user, payload)
    return _serialize_recipe(recipe)


@app.delete("/api/recipes/{recipe_id}")
async def delete_recipe(recipe_id: int, user: User = Depends(get_current_user)):
    cover_url = await run_in_threadpool(_delete_recipe_sync, recipe_id, user)
    await run_in_threadpool(_safe_delete_upload, cover_url)
    return {"success": True}


@app.patch("/api/recipes/{recipe_id}/publish")
async def publish_recipe(
    recipe_id: int, payload: PublishPayload, user: User = Depends(get_current_user)
):
    recipe = await run_in_threadpool(_publish_recipe_sync, recipe_id, user, payload.is_public)
    return _serialize_recipe(recipe)


@app.post("/api/recipes/{recipe_id}/cover")
async def upload_cover(
    recipe_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        _api_error("INVALID_FILE_TYPE", "지원되지 않는 이미지 형식입니다.", 400)

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        _api_error("FILE_TOO_LARGE", "이미지 크기는 5MB 이하여야 합니다.", 413)

    recipe = await run_in_threadpool(_find_owned_recipe_sync, recipe_id, user)
    old_cover = recipe.cover_image_url

    suffix = ".jpg"
    if file.content_type == "image/png":
        suffix = ".png"
    elif file.content_type == "image/webp":
        suffix = ".webp"
    filename = f"{recipe_id}-{uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / filename

    await run_in_threadpool(destination.write_bytes, contents)
    recipe = await run_in_threadpool(_apply_cover_sync, recipe_id, f"/uploads/{filename}")
    await run_in_threadpool(_safe_delete_upload, old_cover)
    return {"success": True, "cover_image_url": recipe.cover_image_url}


@app.delete("/api/account")
async def delete_account(user: User = Depends(get_current_user)):
    deleted_count, cover_urls = await run_in_threadpool(_delete_account_sync, user)
    for cover_url in cover_urls:
        await run_in_threadpool(_safe_delete_upload, cover_url)
    return {"success": True, "deleted_recipes": deleted_count}
