from contextlib import contextmanager

from peewee import SqliteDatabase

from .config import DATABASE_PATH


from pathlib import Path


database = SqliteDatabase(
    str(Path(DATABASE_PATH)),
    pragmas={"foreign_keys": 1},
    check_same_thread=False,
)


@contextmanager
def db_session():
    database.connect(reuse_if_open=True)
    try:
        with database.atomic():
            yield
    finally:
        if not database.is_closed():
            database.close()
