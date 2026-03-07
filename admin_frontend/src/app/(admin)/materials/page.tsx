"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminApiError,
  createMaterial,
  deleteMaterial,
  listMaterials,
  reseedMaterials,
  updateMaterial,
  type Material,
  type MaterialInput,
} from "@/lib/admin-api";

type MaterialFormState = {
  name: string;
  price: string;
  weight_g: string;
  source_keyword: string;
  product_id: string;
  coupang_link: string;
};

const EMPTY_FORM: MaterialFormState = {
  name: "",
  price: "",
  weight_g: "",
  source_keyword: "",
  product_id: "",
  coupang_link: "",
};

function parseNumericInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return Number.NaN;
  }
  return Number(normalized);
}

function toFormState(material: Material): MaterialFormState {
  return {
    name: material.name,
    price: String(material.price),
    weight_g: String(material.weight_g),
    source_keyword: material.source_keyword ?? "",
    product_id: material.product_id ?? "",
    coupang_link: material.coupang_link ?? "",
  };
}

function toPayload(form: MaterialFormState): MaterialInput {
  const name = form.name.trim();
  const price = parseNumericInput(form.price);
  const weight_g = parseNumericInput(form.weight_g);

  if (!name) {
    throw new Error("Material name is required.");
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid number.");
  }
  if (!Number.isFinite(weight_g) || weight_g <= 0) {
    throw new Error("Weight must be greater than zero.");
  }

  return {
    name,
    price,
    weight_g,
    source_keyword: form.source_keyword.trim() || undefined,
    product_id: form.product_id.trim() || undefined,
    coupang_link: form.coupang_link.trim() || undefined,
  };
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString()} KRW`;
}

function formatWeight(value: number): string {
  return `${value.toLocaleString()} g`;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [createForm, setCreateForm] = useState<MaterialFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<MaterialFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listMaterials({
        q: appliedQuery || undefined,
        limit: 1000,
        offset: 0,
      });
      setMaterials(response);
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to load materials.");
      }
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const stats = useMemo(() => {
    const manualCount = materials.filter((material) => material.is_manual).length;
    return {
      total: materials.length,
      manual: manualCount,
      seeded: materials.length - manualCount,
    };
  }, [materials]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedQuery(queryInput.trim());
  }

  function handleCreateFormChange<K extends keyof MaterialFormState>(
    key: K,
    value: MaterialFormState[K],
  ) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function handleEditFormChange<K extends keyof MaterialFormState>(
    key: K,
    value: MaterialFormState[K],
  ) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await createMaterial(toPayload(createForm));
      setCreateForm(EMPTY_FORM);
      setSuccess("Material added.");
      await loadMaterials();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Failed to create material.");
      }
    }
  }

  function startEditing(material: Material) {
    setEditingId(material.id);
    setEditForm(toFormState(material));
    setError(null);
    setSuccess(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function handleSave(materialId: number) {
    setBusyId(materialId);
    setError(null);
    setSuccess(null);

    try {
      await updateMaterial(materialId, toPayload(editForm));
      setSuccess("Material updated.");
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      await loadMaterials();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Failed to update material.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(material: Material) {
    if (!window.confirm(`Delete "${material.name}"? This action cannot be undone.`)) {
      return;
    }

    setBusyId(material.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteMaterial(material.id);
      setSuccess(`Deleted "${material.name}".`);
      if (editingId === material.id) {
        cancelEditing();
      }
      await loadMaterials();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to delete material.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleReseed() {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await reseedMaterials();
      setSuccess(
        `Seed sync complete. created=${result.created}, updated=${result.updated}, skipped=${result.skipped}.`,
      );
      await loadMaterials();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) {
        setError(requestError.message);
      } else {
        setError("Failed to reseed materials.");
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="row">
      <div className="col-12">
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}
      </div>

      <div className="col-12">
        <div className="card card-primary card-outline">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h3 className="card-title">Material database</h3>
            <button
              className="btn btn-outline-primary btn-sm"
              disabled={syncing}
              onClick={handleReseed}
              type="button"
            >
              {syncing ? "Syncing..." : "Reseed from legacy data"}
            </button>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 col-lg-3">
                <div className="small-box bg-info">
                  <div className="inner">
                    <h3>{stats.total}</h3>
                    <p>Total materials</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-boxes" />
                  </div>
                </div>
              </div>
              <div className="col-md-4 col-lg-3">
                <div className="small-box bg-success">
                  <div className="inner">
                    <h3>{stats.manual}</h3>
                    <p>Manual overrides</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-pen" />
                  </div>
                </div>
              </div>
              <div className="col-md-4 col-lg-3">
                <div className="small-box bg-warning">
                  <div className="inner">
                    <h3>{stats.seeded}</h3>
                    <p>Seed-backed rows</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-database" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card card-secondary">
          <div className="card-header">
            <h3 className="card-title">Add material</h3>
          </div>
          <form onSubmit={handleCreateSubmit}>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="material-name">Name</label>
                <input
                  className="form-control"
                  id="material-name"
                  value={createForm.name}
                  onChange={(event) => handleCreateFormChange("name", event.target.value)}
                  placeholder="Premium bread flour"
                />
              </div>
              <div className="form-row">
                <div className="form-group col-sm-6">
                  <label htmlFor="material-price">Price</label>
                  <input
                    className="form-control"
                    id="material-price"
                    value={createForm.price}
                    onChange={(event) => handleCreateFormChange("price", event.target.value)}
                    placeholder="12900"
                  />
                </div>
                <div className="form-group col-sm-6">
                  <label htmlFor="material-weight">Weight (g)</label>
                  <input
                    className="form-control"
                    id="material-weight"
                    value={createForm.weight_g}
                    onChange={(event) => handleCreateFormChange("weight_g", event.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="material-keyword">Keyword</label>
                <input
                  className="form-control"
                  id="material-keyword"
                  value={createForm.source_keyword}
                  onChange={(event) => handleCreateFormChange("source_keyword", event.target.value)}
                  placeholder="flour"
                />
              </div>
              <div className="form-group">
                <label htmlFor="material-product-id">Product ID</label>
                <input
                  className="form-control"
                  id="material-product-id"
                  value={createForm.product_id}
                  onChange={(event) => handleCreateFormChange("product_id", event.target.value)}
                  placeholder="8591387326"
                />
              </div>
              <div className="form-group mb-0">
                <label htmlFor="material-link">Purchase link</label>
                <input
                  className="form-control"
                  id="material-link"
                  value={createForm.coupang_link}
                  onChange={(event) => handleCreateFormChange("coupang_link", event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary" type="submit">
                Create material
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Material inventory</h3>
          </div>
          <div className="card-body">
            <form className="mb-3" onSubmit={handleSearchSubmit}>
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Search by name, keyword, product ID"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                />
                <div className="input-group-append">
                  <button className="btn btn-outline-secondary" type="submit">
                    Search
                  </button>
                </div>
              </div>
            </form>

            <div className="table-responsive p-0">
              {loading ? (
                <div className="admin-empty-state">Loading materials...</div>
              ) : materials.length === 0 ? (
                <div className="admin-empty-state">No materials matched the current filters.</div>
              ) : (
                <table className="table table-hover text-nowrap mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Weight</th>
                      <th>KRW/g</th>
                      <th>Keyword</th>
                      <th>Source</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => {
                      const editing = editingId === material.id;
                      const busy = busyId === material.id;

                      return (
                        <tr key={material.id}>
                          <td className="text-wrap" style={{ minWidth: 280 }}>
                            {editing ? (
                              <div className="d-grid gap-2">
                                <input
                                  className="form-control form-control-sm"
                                  value={editForm.name}
                                  onChange={(event) => handleEditFormChange("name", event.target.value)}
                                />
                                <input
                                  className="form-control form-control-sm"
                                  value={editForm.product_id}
                                  onChange={(event) =>
                                    handleEditFormChange("product_id", event.target.value)
                                  }
                                  placeholder="Product ID"
                                />
                                <input
                                  className="form-control form-control-sm"
                                  value={editForm.coupang_link}
                                  onChange={(event) =>
                                    handleEditFormChange("coupang_link", event.target.value)
                                  }
                                  placeholder="Purchase link"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-weight-semibold">{material.name}</div>
                                <div className="text-muted text-sm">
                                  {material.product_id ? `ID ${material.product_id}` : "No product ID"}
                                </div>
                                {material.coupang_link ? (
                                  <a href={material.coupang_link} rel="noreferrer" target="_blank">
                                    Open link
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </td>
                          <td>
                            {editing ? (
                              <input
                                className="form-control form-control-sm"
                                value={editForm.price}
                                onChange={(event) => handleEditFormChange("price", event.target.value)}
                              />
                            ) : (
                              formatCurrency(material.price)
                            )}
                          </td>
                          <td>
                            {editing ? (
                              <input
                                className="form-control form-control-sm"
                                value={editForm.weight_g}
                                onChange={(event) => handleEditFormChange("weight_g", event.target.value)}
                              />
                            ) : (
                              formatWeight(material.weight_g)
                            )}
                          </td>
                          <td>{material.price_per_g.toFixed(4)}</td>
                          <td>
                            {editing ? (
                              <input
                                className="form-control form-control-sm"
                                value={editForm.source_keyword}
                                onChange={(event) =>
                                  handleEditFormChange("source_keyword", event.target.value)
                                }
                              />
                            ) : (
                              material.source_keyword ?? "-"
                            )}
                          </td>
                          <td className="text-wrap" style={{ minWidth: 220 }}>
                            <div className="d-flex flex-wrap gap-1">
                              <span className={`badge ${material.is_manual ? "badge-success" : "badge-secondary"}`}>
                                {material.is_manual ? "manual" : "seed"}
                              </span>
                              {material.seed_sources.map((source) => (
                                <span className="badge badge-light" key={`${material.id}-${source}`}>
                                  {source}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {editing ? (
                                <>
                                  <button
                                    className="btn btn-primary"
                                    disabled={busy}
                                    onClick={() => handleSave(material.id)}
                                    type="button"
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-default"
                                    disabled={busy}
                                    onClick={cancelEditing}
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-default"
                                    disabled={busy}
                                    onClick={() => startEditing(material)}
                                    type="button"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    disabled={busy}
                                    onClick={() => handleDelete(material)}
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
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
    </div>
  );
}
