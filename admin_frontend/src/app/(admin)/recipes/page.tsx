"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminApiError,
  deleteRecipe,
  listRecipes,
  publishRecipe,
  type Recipe,
} from "@/lib/admin-api";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"created_at" | "updated_at" | "title">("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyRecipeId, setBusyRecipeId] = useState<number | null>(null);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listRecipes({
        q: query || undefined,
        category: category || undefined,
        sort,
        order,
        limit: 100,
      });
      setRecipes(response);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to load recipes.");
      }
    } finally {
      setLoading(false);
    }
  }, [category, order, query, sort]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const visibleRecipes = useMemo(() => {
    if (visibility === "public") {
      return recipes.filter((recipe) => recipe.is_public);
    }
    if (visibility === "private") {
      return recipes.filter((recipe) => !recipe.is_public);
    }
    return recipes;
  }, [recipes, visibility]);

  async function handlePublishToggle(recipe: Recipe) {
    setBusyRecipeId(recipe.id);
    setError(null);
    setSuccess(null);
    try {
      const updatedRecipe = await publishRecipe(recipe.id, !recipe.is_public);
      setRecipes((currentRecipes) =>
        currentRecipes.map((currentRecipe) =>
          currentRecipe.id === updatedRecipe.id ? updatedRecipe : currentRecipe,
        ),
      );
      setSuccess(`Updated visibility for "${updatedRecipe.title}".`);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to update recipe visibility.");
      }
    } finally {
      setBusyRecipeId(null);
    }
  }

  async function handleDelete(recipe: Recipe) {
    const confirmed = window.confirm(`Delete "${recipe.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setBusyRecipeId(recipe.id);
    setError(null);
    setSuccess(null);
    try {
      await deleteRecipe(recipe.id);
      setRecipes((currentRecipes) => currentRecipes.filter((currentRecipe) => currentRecipe.id !== recipe.id));
      setSuccess(`Deleted "${recipe.title}".`);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to delete the recipe.");
      }
    } finally {
      setBusyRecipeId(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadRecipes();
  }

  return (
    <div className="row">
      <div className="col-12">
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}
      </div>

      <div className="col-12">
        <div className="card card-primary card-outline">
          <div className="card-header">
            <h3 className="card-title">Search and moderate recipes</h3>
          </div>
          <div className="card-body">
            <form className="row" onSubmit={handleSubmit}>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="query">Keyword</label>
                  <input
                    className="form-control"
                    id="query"
                    placeholder="title, ingredient, step"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    className="form-control"
                    id="category"
                    placeholder="baking"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label htmlFor="sort">Sort</label>
                  <select
                    className="form-control"
                    id="sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as typeof sort)}
                  >
                    <option value="updated_at">Updated</option>
                    <option value="created_at">Created</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label htmlFor="order">Order</label>
                  <select
                    className="form-control"
                    id="order"
                    value={order}
                    onChange={(event) => setOrder(event.target.value as typeof order)}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label htmlFor="visibility">Visibility</label>
                  <select
                    className="form-control"
                    id="visibility"
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value as typeof visibility)}
                  >
                    <option value="all">All</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" type="submit">
                  Refresh list
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recipe inventory</h3>
          </div>
          <div className="card-body table-responsive p-0">
            {loading ? (
              <div className="admin-empty-state">Loading recipes...</div>
            ) : visibleRecipes.length === 0 ? (
              <div className="admin-empty-state">No recipes matched the current filters.</div>
            ) : (
              <table className="table table-hover text-nowrap mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Category</th>
                    <th>Visibility</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecipes.map((recipe) => {
                    const busy = busyRecipeId === recipe.id;
                    return (
                      <tr key={recipe.id}>
                        <td>#{recipe.id}</td>
                        <td>
                          <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                        </td>
                        <td>#{recipe.user_id}</td>
                        <td>{recipe.category ?? "-"}</td>
                        <td>
                          <span className={`badge ${recipe.is_public ? "badge-success" : "badge-warning"}`}>
                            {recipe.is_public ? "public" : "private"}
                          </span>
                        </td>
                        <td>{new Date(recipe.updated_at).toLocaleString()}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link className="btn btn-default" href={`/recipes/${recipe.id}`}>
                              View
                            </Link>
                            <button
                              className={`btn ${recipe.is_public ? "btn-warning" : "btn-success"}`}
                              disabled={busy}
                              onClick={() => handlePublishToggle(recipe)}
                              type="button"
                            >
                              {recipe.is_public ? "Make private" : "Publish"}
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={busy}
                              onClick={() => handleDelete(recipe)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
