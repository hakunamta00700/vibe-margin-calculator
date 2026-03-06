from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any] | None = None


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
