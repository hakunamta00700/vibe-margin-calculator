from __future__ import annotations

import importlib
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _sign_up(client: TestClient, email: str, password: str = "password1234") -> dict:
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, tmp_path) -> Iterator[TestClient]:
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "recipes.db"))
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("FRONTEND_ORIGIN", "http://localhost:3000")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000")
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "Admin12345!")

    from app import config, database, models, schemas, security
    from app import main

    for module in (config, database, models, schemas, security, main):
        importlib.reload(module)

    with TestClient(main.app) as test_client:
        yield test_client

    if not database.database.is_closed():
        database.database.close()


def test_bootstrap_admin_can_list_users(client: TestClient) -> None:
    login = _login(client, "admin@example.com", "Admin12345!")

    assert login["user"]["role"] == "admin"

    response = client.get(
        "/api/admin/users",
        headers=_auth_headers(login["access_token"]),
    )

    assert response.status_code == 200
    users = response.json()
    assert any(user["email"] == "admin@example.com" and user["role"] == "admin" for user in users)


def test_non_admin_cannot_access_admin_routes(client: TestClient) -> None:
    login = _sign_up(client, "member@example.com")

    response = client.get(
        "/api/admin/users",
        headers=_auth_headers(login["access_token"]),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_admin_can_promote_user_and_view_private_recipe(client: TestClient) -> None:
    member = _sign_up(client, "member@example.com")
    admin = _login(client, "admin@example.com", "Admin12345!")

    promote_response = client.patch(
        f"/api/admin/users/{member['user']['id']}/role",
        headers=_auth_headers(admin["access_token"]),
        json={"role": "admin"},
    )

    assert promote_response.status_code == 200
    assert promote_response.json()["role"] == "admin"

    owner = _sign_up(client, "owner@example.com")
    recipe_response = client.post(
        "/api/recipes",
        headers=_auth_headers(owner["access_token"]),
        json={
            "title": "Private Recipe",
            "description": "Only the owner should see this unless admin.",
            "ingredients": [{"text": "Flour"}],
            "steps": [{"text": "Mix"}],
            "is_public": False,
        },
    )

    assert recipe_response.status_code == 201
    recipe_id = recipe_response.json()["id"]

    access_response = client.get(
        f"/api/recipes/{recipe_id}",
        headers=_auth_headers(admin["access_token"]),
    )

    assert access_response.status_code == 200
    assert access_response.json()["id"] == recipe_id
