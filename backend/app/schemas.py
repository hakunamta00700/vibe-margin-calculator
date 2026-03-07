from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: Literal["user", "admin"]
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse | None = None


class RecipeCreatePayload(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    ingredients: List[Dict[str, Any]] = Field(default_factory=list)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    servings: Optional[int] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False
    cover_image_url: Optional[str] = None
    source_url: Optional[str] = None
    nutrition: Optional[Dict[str, Any]] = None


class RecipePatchPayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[Dict[str, Any]]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    servings: Optional[int] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    cover_image_url: Optional[str] = None
    source_url: Optional[str] = None
    nutrition: Optional[Dict[str, Any]] = None


class RecipeQuery(BaseModel):
    is_public: Optional[bool] = None


class PublishPayload(BaseModel):
    is_public: bool


class PasswordResetPayload(BaseModel):
    email: EmailStr


class AdminRoleUpdatePayload(BaseModel):
    role: Literal["user", "admin"]


class RecipeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    ingredients: List[Dict[str, Any]]
    steps: List[Dict[str, Any]]
    prep_time_min: Optional[int] = None
    cook_time_min: Optional[int] = None
    servings: Optional[int] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False
    cover_image_url: Optional[str] = None
    source_url: Optional[str] = None
    nutrition: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str


class MaterialCreatePayload(BaseModel):
    name: str = Field(min_length=1)
    price: int = Field(ge=0)
    weight_g: int = Field(gt=0)
    coupang_link: Optional[str] = None
    source_keyword: Optional[str] = None
    product_id: Optional[str] = None


class MaterialPatchPayload(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = Field(default=None, ge=0)
    weight_g: Optional[int] = Field(default=None, gt=0)
    coupang_link: Optional[str] = None
    source_keyword: Optional[str] = None
    product_id: Optional[str] = None


class MaterialResponse(BaseModel):
    id: int
    name: str
    price: int
    weight_g: int
    price_per_g: float
    coupang_link: Optional[str] = None
    source_keyword: Optional[str] = None
    product_id: Optional[str] = None
    seed_sources: List[str] = Field(default_factory=list)
    is_manual: bool = False
    created_at: str
    updated_at: str


class SeedSyncResponse(BaseModel):
    processed: int
    created: int
    updated: int
    skipped: int
    sources: List[str] = Field(default_factory=list)
