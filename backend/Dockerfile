FROM python:3.12-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.6.6 /uv /uvx /bin/
COPY pyproject.toml /app/pyproject.toml
RUN uv sync --no-dev --no-install-project

COPY . /app
RUN uv sync --no-dev --no-install-project

EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
