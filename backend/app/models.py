from datetime import datetime, timezone

from peewee import (
    AutoField,
    BooleanField,
    DateTimeField,
    ForeignKeyField,
    IntegerField,
    Model,
    TextField,
)
from playhouse.sqlite_ext import JSONField

from .database import database


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


ROLE_USER = "user"
ROLE_ADMIN = "admin"
VALID_ROLES = {ROLE_USER, ROLE_ADMIN}


class BaseModel(Model):
    class Meta:
        database = database


class User(BaseModel):
    id = AutoField()
    email = TextField(unique=True)
    hashed_password = TextField()
    role = TextField(default=ROLE_USER)
    created_at = DateTimeField(default=utcnow)


class Recipe(BaseModel):
    id = AutoField()
    user = ForeignKeyField(User, backref="recipes", on_delete="CASCADE")
    title = TextField()
    description = TextField(null=True)
    ingredients = JSONField(default=list)
    steps = JSONField(default=list)
    prep_time_min = IntegerField(null=True)
    cook_time_min = IntegerField(null=True)
    servings = IntegerField(null=True)
    category = TextField(null=True)
    tags = JSONField(default=list)
    is_public = BooleanField(default=False)
    cover_image_url = TextField(null=True)
    source_url = TextField(null=True)
    nutrition = JSONField(null=True)
    created_at = DateTimeField(default=utcnow)
    updated_at = DateTimeField(default=utcnow)


class Material(BaseModel):
    id = AutoField()
    key = TextField(unique=True)
    name = TextField()
    price = IntegerField()
    weight_g = IntegerField()
    coupang_link = TextField(null=True)
    source_keyword = TextField(null=True)
    product_id = TextField(null=True)
    seed_sources = JSONField(default=list)
    is_manual = BooleanField(default=False)
    created_at = DateTimeField(default=utcnow)
    updated_at = DateTimeField(default=utcnow)


def _ensure_column(table_name: str, column_name: str, column_sql: str) -> None:
    existing_columns = {column.name for column in database.get_columns(table_name)}
    if column_name in existing_columns:
        return
    database.execute_sql(f'ALTER TABLE "{table_name}" ADD COLUMN {column_sql}')


def _migrate_user_schema() -> None:
    _ensure_column(User._meta.table_name, "role", f"role TEXT NOT NULL DEFAULT '{ROLE_USER}'")
    database.execute_sql(
        f'UPDATE "{User._meta.table_name}" SET role = ? WHERE role IS NULL OR TRIM(role) = ""',
        (ROLE_USER,),
    )


def init_schema() -> None:
    database.create_tables([User, Recipe, Material], safe=True)
    _migrate_user_schema()
