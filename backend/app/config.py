import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

DB_DEFAULT = REPO_ROOT / "data" / "recipes.db"
UPLOAD_DEFAULT = BACKEND_DIR / "uploads"
SEED_DATA_DEFAULT = REPO_ROOT / "data"
LEGACY_INDEX_DEFAULT = REPO_ROOT / "index.html"

DATABASE_PATH = os.getenv("DATABASE_PATH", str(DB_DEFAULT))
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-very-strong")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", FRONTEND_ORIGIN)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(UPLOAD_DEFAULT)))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))
SEED_DATA_DIR = Path(os.getenv("SEED_DATA_DIR", str(SEED_DATA_DEFAULT)))
LEGACY_INDEX_HTML_PATH = Path(os.getenv("LEGACY_INDEX_HTML_PATH", str(LEGACY_INDEX_DEFAULT)))

Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
