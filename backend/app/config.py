import os
from pathlib import Path


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DEFAULT = os.path.normpath(os.path.join(BASE_DIR, "..", "data", "recipes.db"))
UPLOAD_DEFAULT = os.path.normpath(os.path.join(BASE_DIR, "..", "uploads"))

DATABASE_PATH = os.getenv("DATABASE_PATH", DB_DEFAULT)
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-very-strong")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", FRONTEND_ORIGIN)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", UPLOAD_DEFAULT))
Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))
