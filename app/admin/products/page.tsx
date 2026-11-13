'use client';

import React, { useState, useEffect } from 'react';
import {
  createClient,
  insertSupabaseProduct,
  updateSupabaseProduct,
} from '../../../src/utils/supabase/client';
import {
  isSupabaseConfigured,
  deleteSupabaseProduct,
} from '../../../src/lib/supabase';

interface AdminProductRecord {
  id: string;
  name: string;
  description?: string;
  full_description?: string;
  short_description?: string;
  price: number;
  category?: string;
  category_name?: string;
  image_url?: string;
  image?: string;
  stock?: number;
  created_at?: string;
}

interface ProductFormState {
  id: string | null;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  stock: string;
}

const EMPTY_FORM: ProductFormState = {
  id: null,
  name: '',
  description: '',
  price: '',
  category: '',
  image_url: '',
  stock: '',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message);
        setStatusFeedback({
          type: 'error',
          message: `Error fetching products: ${error.message}`,
        });
      } else {
        setProducts((data as AdminProductRecord[]) || []);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching products:', err);
      setStatusFeedback({
        type: 'error',
        message: err?.message || 'Unable to fetch products from database.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle Input Changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Save or Update Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusFeedback(null);

    const productPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      category: form.category.trim(),
      image_url: form.image_url.trim(),
      stock: parseInt(form.stock, 10) || 0,
      is_active: true,
    };

    try {
      if (!isSupabaseConfigured()) {
        // Local preview mode fallback if Supabase keys are not configured
        if (form.id) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === form.id ? { ...p, ...productPayload } : p
            )
          );
          setStatusFeedback({
            type: 'success',
            message: 'Product updated locally (configure Supabase env keys to persist remotely).',
          });
        } else {
          const localItem: AdminProductRecord = {
            id: 'prod-' + Date.now(),
            ...productPayload,
            created_at: new Date().toISOString(),
          };
          setProducts((prev) => [localItem, ...prev]);
          setStatusFeedback({
            type: 'success',
            message: 'Product added locally (configure Supabase env keys to persist remotely).',
          });
        }
        setForm(EMPTY_FORM);
        return;
      }

      if (form.id) {
        // Update existing product using schema-audited handler
        const res = await updateSupabaseProduct(form.id, productPayload);
        if (!res.success) {
          console.error('Supabase Update Error:', res.error);
          setStatusFeedback({
            type: 'error',
            message: `Failed to update product${
              res.missingField ? ` (column "${res.missingField}")` : ''
            }: ${res.error?.message || 'Database update error'}`,
          });
        } else {
          setStatusFeedback({
            type: 'success',
            message: 'Product updated successfully!',
          });
          setForm(EMPTY_FORM);
          await fetchProducts();
        }
      } else {
        // Insert new product using schema-audited handler
        const res = await insertSupabaseProduct(productPayload);
        if (!res.success) {
          console.error('Supabase Save Error:', res.error);
          setStatusFeedback({
            type: 'error',
            message: `Failed to save product${
              res.missingField ? ` (column "${res.missingField}")` : ''
            }: ${res.error?.message || 'Database insert error'}`,
          });
        } else {
          setStatusFeedback({
            type: 'success',
            message: 'Product added successfully!',
          });
          setForm(EMPTY_FORM);
          await fetchProducts();
        }
      }
    } catch (err: any) {
      console.error('Unexpected Supabase Save Error:', err);
      setStatusFeedback({
        type: 'error',
        message: `Failed to save product: ${err?.message || 'Unexpected error'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // Edit product action
  const handleEdit = (prod: AdminProductRecord) => {
    setForm({
      id: prod.id,
      name: prod.name || '',
      description:
        prod.description || prod.full_description || prod.short_description || '',
      price: prod.price !== undefined && prod.price !== null ? String(prod.price) : '',
      category: prod.category || prod.category_name || '',
      image_url: prod.image_url || prod.image || '',
      stock: prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : '',
    });
    setStatusFeedback(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delete product action (non-blocking inline confirm)
  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setConfirmDeleteId(null);
    if (!isSupabaseConfigured()) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setStatusFeedback({ type: 'info', message: 'Product removed locally.' });
      return;
    }

    const { error } = await deleteSupabaseProduct(id);
    if (error) {
      console.error('Supabase Delete Error:', error);
      setStatusFeedback({
        type: 'error',
        message: `Error deleting: ${error.message}`,
      });
    } else {
      setStatusFeedback({
        type: 'success',
        message: 'Product deleted from store inventory.',
      });
      await fetchProducts();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto text-slate-900">
      <header className="mb-8 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            AjmanTech Admin Control Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage store inventory, update prices, and publish live catalog items.
          </p>
        </div>
        <a
          href="/admin"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← Full Admin Dashboard
        </a>
      </header>

      {statusFeedback && (
        <div
          role="status"
          className={`mb-6 px-4 py-3 rounded-lg border text-sm font-medium flex items-center justify-between gap-4 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{statusFeedback.message}</span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Product Form Grid */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {form.id ? 'Edit Product' : 'Add New Product'}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Crystal LED Chandelier"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Chandeliers, Fancy Lights"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Price (₦) *
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="45000"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
              placeholder="10"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="col-span-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="col-span-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Product specifications, wattage, warranty..."
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="col-span-full flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-md transition-colors cursor-pointer"
            >
              {saving
                ? 'Saving...'
                : form.id
                ? 'Update Product'
                : 'Publish Product'}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setStatusFeedback(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-md transition-colors cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List Table */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">
        Live Store Inventory ({products.length})
      </h2>
      {loading ? (
        <p className="text-sm text-slate-500 py-6">Loading catalog items...</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold text-slate-700">Name</th>
                <th className="p-3 font-semibold text-slate-700">Category</th>
                <th className="p-3 font-semibold text-slate-700">Price</th>
                <th className="p-3 font-semibold text-slate-700">Stock</th>
                <th className="p-3 font-semibold text-slate-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-slate-500 text-sm"
                  >
                    No products found in database. Add your first one above!
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="p-3 font-medium text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-500">
                      {p.category || p.category_name || 'N/A'}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      ₦{Number(p.price || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-700">{p.stock ?? 0}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded mr-2 cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === p.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
