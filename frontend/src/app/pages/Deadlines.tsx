import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Plus, Pencil, Trash2, Loader2, Calendar } from "lucide-react";

type Deadline = {
  id: string;
  title: string;
  date: string;
  is_active: boolean;
};

const fmt = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const EMPTY_FORM = { title: "", date: "" };

export function Deadlines() {

  const [deadlines,  setDeadlines ] = useState<Deadline[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [saving,     setSaving    ] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm,   setShowForm  ] = useState(false);
  const [editTarget, setEditTarget] = useState<Deadline | null>(null);
  const [form,       setForm      ] = useState(EMPTY_FORM);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchDeadlines = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(`${API_BASE_URL}/deadlines/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDeadlines(data.deadlines);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeadlines(); }, []);

  // ── helpers ────────────────────────────────────────────────────────────────

  const token = async () => auth.currentUser?.getIdToken() ?? "";

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (d: Deadline) => {
    setEditTarget(d);
    setForm({ title: d.title, date: d.date.slice(0, 10) });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  // ── save ───────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const url    = editTarget
        ? `${API_BASE_URL}/deadlines/${editTarget.id}`
        : `${API_BASE_URL}/deadlines`;
      const method = editTarget ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        await fetchDeadlines();
        closeForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── toggle active ──────────────────────────────────────────────────────────

  const toggleActive = async (d: Deadline) => {
    try {
      await fetch(`${API_BASE_URL}/deadlines/${d.id}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body    : JSON.stringify({ is_active: !d.is_active }),
      });
      setDeadlines((prev) =>
        prev.map((x) => x.id === d.id ? { ...x, is_active: !d.is_active } : x)
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this deadline?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE_URL}/deadlines/${id}`, {
        method  : "DELETE",
        headers : { Authorization: `Bearer ${await token()}` },
      });
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="p-10 text-center text-text-mid">Loading deadlines...</div>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Government Deadlines</h1>
          <p className="text-sm text-text-mid mt-0.5">
            Manage tax deadlines shown to customers in the app
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

            <h2 className="text-lg font-bold text-text-dark">
              {editTarget ? "Edit Deadline" : "Add New Deadline"}
            </h2>

            <div className="space-y-3">

              <div>
                <label className="text-xs font-semibold text-text-mid mb-1 block">Title *</label>
                <Input
                  placeholder="e.g. ITR Filing Deadline"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-mid mb-1 block">Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="rounded-xl"
                />
              </div>

            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={closeForm}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving || !form.title.trim() || !form.date}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-dark"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : editTarget ? "Update" : "Add"}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* LIST */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Deadlines ({deadlines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {deadlines.length === 0 ? (
            <div className="py-12 text-center text-text-light text-sm">
              No deadlines yet. Add one above.
            </div>
          ) : (
            <div className="space-y-3">
              {deadlines.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-opacity ${
                    d.is_active ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-dark text-sm">{d.title}</p>
                    <p className="text-xs text-text-mid mt-0.5">{fmt(d.date)}</p>
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(d)}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                      d.is_active
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                    }`}
                  >
                    {d.is_active ? "Active" : "Hidden"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(d)}
                    className="text-text-light hover:text-primary transition-colors p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => remove(d.id)}
                    disabled={deletingId === d.id}
                    className="text-text-light hover:text-red-600 transition-colors p-1"
                  >
                    {deletingId === d.id
                      ? <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}