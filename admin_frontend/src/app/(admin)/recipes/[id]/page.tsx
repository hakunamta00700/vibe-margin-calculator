/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminApiError,
  deleteRecipe,
  getAssetUrl,
  getRecipe,
  publishRecipe,
  type Recipe,
} from "@/lib/admin-api";

function recipeItemToText(item: Record<string, unknown>) {
  const textCandidate = item.text ?? item.label ?? item.value ?? item.name;
  if (typeof textCandidate === "string" || typeof textCandidate === "number") {
    return String(textCandidate);
  }
  return JSON.stringify(item);
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const recipeId = Number(params.id);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRecipe() {
      setLoading(true);
      setError(null);
      try {
        const response = await getRecipe(recipeId);
        if (active) {
          setRecipe(response);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        if (requestError instanceof AdminApiError) {
          setError(requestError.message);
        } else {
          setError("Failed to load the recipe.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (!Number.isNaN(recipeId)) {
      loadRecipe();
    } else {
      setError("Invalid recipe id.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [recipeId]);

  async function handleVisibilityToggle() {
    if (!recipe) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const updatedRecipe = await publishRecipe(recipe.id, !recipe.is_public);
      setRecipe(updatedRecipe);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to update recipe visibility.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!recipe) {
      return;
    }

    const confirmed = window.confirm(`Delete "${recipe.title}"?`);
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await deleteRecipe(recipe.id);
      router.push("/recipes");
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to delete the recipe.");
      }
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="admin-empty-state">Loading recipe...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!recipe) {
    return <div className="admin-empty-state">Recipe not found.</div>;
  }

  const coverUrl = getAssetUrl(recipe.cover_image_url);

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{recipe.title}</h3>
          </div>
          <div className="card-body">
            {coverUrl ? <img alt={recipe.title} className="recipe-cover mb-4" src={coverUrl} /> : null}
            <p className="text-muted">{recipe.description ?? "No description provided."}</p>

            <div className="row mt-4">
              <div className="col-md-6">
                <h5>Ingredients</h5>
                <ul className="list-group">
                  {recipe.ingredients.map((item, index) => (
                    <li className="list-group-item" key={`${recipe.id}-ingredient-${index}`}>
                      {recipeItemToText(item)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <h5>Steps</h5>
                <ol className="list-group list-group-numbered">
                  {recipe.steps.map((item, index) => (
                    <li className="list-group-item" key={`${recipe.id}-step-${index}`}>
                      {recipeItemToText(item)}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card card-primary card-outline">
          <div className="card-header">
            <h3 className="card-title">Moderation actions</h3>
          </div>
          <div className="card-body">
            <dl className="row">
              <dt className="col-sm-5">Recipe ID</dt>
              <dd className="col-sm-7">#{recipe.id}</dd>
              <dt className="col-sm-5">Owner</dt>
              <dd className="col-sm-7">#{recipe.user_id}</dd>
              <dt className="col-sm-5">Visibility</dt>
              <dd className="col-sm-7">
                <span className={`badge ${recipe.is_public ? "badge-success" : "badge-warning"}`}>
                  {recipe.is_public ? "public" : "private"}
                </span>
              </dd>
              <dt className="col-sm-5">Category</dt>
              <dd className="col-sm-7">{recipe.category ?? "-"}</dd>
              <dt className="col-sm-5">Prep time</dt>
              <dd className="col-sm-7">{recipe.prep_time_min ?? "-"} min</dd>
              <dt className="col-sm-5">Cook time</dt>
              <dd className="col-sm-7">{recipe.cook_time_min ?? "-"} min</dd>
              <dt className="col-sm-5">Updated</dt>
              <dd className="col-sm-7">{new Date(recipe.updated_at).toLocaleString()}</dd>
            </dl>

            {recipe.tags.length > 0 ? (
              <p>
                {recipe.tags.map((tag) => (
                  <span className="badge badge-light mr-2" key={tag}>
                    {tag}
                  </span>
                ))}
              </p>
            ) : null}

            <div className="btn-group btn-group-sm d-flex">
              <button
                className={`btn ${recipe.is_public ? "btn-warning" : "btn-success"}`}
                disabled={busy}
                onClick={handleVisibilityToggle}
                type="button"
              >
                {recipe.is_public ? "Make private" : "Publish"}
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={handleDelete} type="button">
                Delete
              </button>
            </div>

            <Link className="btn btn-default btn-sm btn-block mt-3" href="/recipes">
              Back to recipe list
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
