# SQLite 스키마 문서

## 1. users 테이블
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## 2. recipes 테이블
```sql
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL DEFAULT '[]',
  steps TEXT NOT NULL DEFAULT '[]',
  prep_time_min INTEGER,
  cook_time_min INTEGER,
  servings INTEGER,
  category TEXT,
  tags TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 3. 데이터 규약
- `ingredients`, `steps`, `tags`는 JSON 문자열로 저장
- `is_public`: `0/1` 사용
- `created_at`, `updated_at`: ISO 문자열

## 4. 인덱스 제안(운영)
- `CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);`
- `CREATE INDEX IF NOT EXISTS idx_recipes_public ON recipes(is_public);`
- `CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at DESC);`

