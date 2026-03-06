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


class BaseModel(Model):
    class Meta:
        database = database


class User(BaseModel):
    id = AutoField()
    email = TextField(unique=True)
    hashed_password = TextField()
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


def init_schema() -> None:
    database.create_tables([User, Recipe], safe=True)
