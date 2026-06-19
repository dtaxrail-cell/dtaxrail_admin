import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Plus, Trash2, Search, ExternalLink } from "lucide-react";
import { Link } from "react-router";

// ─── types ────────────────────────────────────────────────────────────────────

type Filing = {
  id: string;
  member_name: string;
  member_pan: string;
  member_password: string;
  member_phone: string;
  member_email: string;
  member_dob: string | null;
  status: string;
  payment_status: string;
  custom_fields: Record<string, string>;
  filing_type: string;
  assessment_year: string;
  created_at: string;
};

type CustomColumn = {
  id: string;
  label: string;
  field_key: string;
  position: number;
};

// ─── fixed columns (always present, in order) ─────────────────────────────────

const FIXED_COLS = [
  { key: "member_name",     label: "Full Name"  },
  { key: "member_pan",      label: "PAN"        },
  { key: "member_password", label: "Password"   },
  { key: "member_phone",    label: "Phone"      },
  { key: "member_email",    label: "Email"      },
  { key: "member_dob",      label: "DOB"        },
  { key: "status",          label: "Status"     },
  { key: "payment_status",  label: "Payment"    },
] as const;

// ─── tiny inline editable cell ───────────────────────────────────────────────

function EditableCell({
  value,
  onCommit,
  className = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft  ] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`w-full min-w-[80px] px-2 py-1 text-sm border border-blue-400 rounded outline-none bg-white ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`block w-full min-w-[80px] px-2 py-1 text-sm rounded cursor-text hover:bg-blue-50 transition-colors ${className}`}
    >
      {value || <span className="text-gray-300 text-xs italic">—</span>}
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function FilingsSpreadsheet() {

  const [filings,       setFilings      ] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading,       setLoading      ] = useState(true);
  const [searchTerm,    setSearchTerm   ] = useState("");
  const [newColLabel,   setNewColLabel  ] = useState("");
  const [addingCol,     setAddingCol    ] = useState(false);
  const [saving,        setSaving       ] = useState<Record<string, boolean>>({});

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch(`${API_BASE_URL}/filings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFilings(data.filings ?? []);
        setCustomColumns(data.customColumns ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── token helper ───────────────────────────────────────────────────────────

  const token = async () => auth.currentUser?.getIdToken() ?? "";

  // ── update status ──────────────────────────────────────────────────────────

  const updateStatus = async (filingId: string, status: string) => {
    setSaving((s) => ({ ...s, [filingId + "_status"]: true }));
    try {
      await fetch(`${API_BASE_URL}/filings/status/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body    : JSON.stringify({ status }),
      });
      setFilings((prev) =>
        prev.map((f) => (f.id === filingId ? { ...f, status } : f))
      );
    } finally {
      setSaving((s) => ({ ...s, [filingId + "_status"]: false }));
    }
  };

  // ── update payment ─────────────────────────────────────────────────────────

  const updatePayment = async (filingId: string, payment_status: string) => {
    setSaving((s) => ({ ...s, [filingId + "_payment"]: true }));
    try {
      await fetch(`${API_BASE_URL}/filings/payment/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body    : JSON.stringify({ payment_status }),
      });
      setFilings((prev) =>
        prev.map((f) => (f.id === filingId ? { ...f, payment_status } : f))
      );
    } finally {
      setSaving((s) => ({ ...s, [filingId + "_payment"]: false }));
    }
  };

  // ── update custom field cell ───────────────────────────────────────────────

  const updateCustomField = async (filingId: string, field_key: string, value: string) => {
    try {
      await fetch(`${API_BASE_URL}/filings/custom-field/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body    : JSON.stringify({ field_key, value }),
      });
      setFilings((prev) =>
        prev.map((f) =>
          f.id === filingId
            ? { ...f, custom_fields: { ...f.custom_fields, [field_key]: value } }
            : f
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ── add custom column ──────────────────────────────────────────────────────

  const addColumn = async () => {
    if (!newColLabel.trim()) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method  : "POST",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body    : JSON.stringify({ label: newColLabel.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomColumns((prev) => [...prev, data.column]);
        setNewColLabel("");
        setAddingCol(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── delete custom column ───────────────────────────────────────────────────

  const deleteColumn = async (field_key: string) => {
    if (!confirm(`Delete column "${field_key}" from all filings?`)) return;
    try {
      await fetch(`${API_BASE_URL}/filings/custom-columns/${field_key}`, {
        method  : "DELETE",
        headers : { Authorization: `Bearer ${await token()}` },
      });
      setCustomColumns((prev) => prev.filter((c) => c.field_key !== field_key));
      setFilings((prev) =>
        prev.map((f) => {
          const cf = { ...f.custom_fields };
          delete cf[field_key];
          return { ...f, custom_fields: cf };
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ── csv export ─────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = [
      ...FIXED_COLS.map((c) => c.label),
      ...customColumns.map((c) => c.label),
    ];

    const rows = filteredFilings.map((f) => [
      f.member_name     ?? "",
      f.member_pan      ?? "",
      f.member_password ?? "",
      f.member_phone    ?? "",
      f.member_email    ?? "",
      f.member_dob      ? new Date(f.member_dob).toLocaleDateString() : "",
      f.status          ?? "",
      f.payment_status  ?? "",
      ...customColumns.map((c) => f.custom_fields?.[c.field_key] ?? ""),
    ]);

    const csv  = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `filings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── filter ─────────────────────────────────────────────────────────────────

  const filteredFilings = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return filings;
    return filings.filter((f) =>
      [f.member_name, f.member_pan, f.member_phone, f.member_email, f.status, f.payment_status]
        .some((v) => (v ?? "").toLowerCase().includes(s))
    );
  }, [filings, searchTerm]);

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-mid">
        Loading spreadsheet...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Filings</h1>
          <p className="text-sm text-text-mid mt-0.5">
            {filteredFilings.length} filing{filteredFilings.length !== 1 ? "s" : ""}
            {searchTerm ? " matched" : " total"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              placeholder="Search name, PAN, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-gray-200 outline-none focus:border-blue-400 w-56"
            />
          </div>

          {/* add column */}
          {addingCol ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                placeholder="Column name"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addColumn(); if (e.key === "Escape") setAddingCol(false); }}
                className="px-3 py-2 text-sm rounded-xl border border-blue-400 outline-none w-36"
              />
              <button
                onClick={addColumn}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => { setAddingCol(false); setNewColLabel(""); }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add column
            </button>
          )}

          {/* export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── SPREADSHEET ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">

            {/* HEADER ROW */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">

                {/* fixed col headers */}
                {FIXED_COLS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-r border-gray-100 last:border-r-0"
                  >
                    {col.label}
                  </th>
                ))}

                {/* custom col headers */}
                {customColumns.map((col) => (
                  <th
                    key={col.field_key}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap border-r border-gray-100 group"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      <button
                        onClick={() => deleteColumn(col.field_key)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-1"
                        title="Delete column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}

                {/* workspace link col */}
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Workspace
                </th>

              </tr>
            </thead>

            {/* DATA ROWS */}
            <tbody>
              {filteredFilings.length === 0 && (
                <tr>
                  <td
                    colSpan={FIXED_COLS.length + customColumns.length + 1}
                    className="py-16 text-center text-gray-400 text-sm"
                  >
                    {searchTerm ? "No filings match your search" : "No filings yet — they appear here once a customer files"}
                  </td>
                </tr>
              )}

              {filteredFilings.map((filing, i) => (
                <tr
                  key={filing.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >

                  {/* ── FIXED CELLS ── */}

                  {/* Full Name */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[140px]">
                    <span className="block px-2 py-1 text-sm font-medium text-gray-800">
                      {filing.member_name || "—"}
                    </span>
                  </td>

                  {/* PAN */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[110px]">
                    <span className="block px-2 py-1 text-sm font-mono text-gray-700">
                      {filing.member_pan || "—"}
                    </span>
                  </td>

                  {/* Password */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[110px]">
                    <span className="block px-2 py-1 text-sm font-mono text-gray-500">
                      {filing.member_password || "—"}
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[110px]">
                    <span className="block px-2 py-1 text-sm text-gray-700">
                      {filing.member_phone || "—"}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[170px]">
                    <span className="block px-2 py-1 text-sm text-gray-700 truncate max-w-[160px]" title={filing.member_email}>
                      {filing.member_email || "—"}
                    </span>
                  </td>

                  {/* DOB */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[100px]">
                    <span className="block px-2 py-1 text-sm text-gray-600">
                      {filing.member_dob
                        ? new Date(filing.member_dob).toLocaleDateString("en-IN")
                        : "—"}
                    </span>
                  </td>

                  {/* ✅ FIXED: Status converted from Dropdown to fully open Editable Text Row */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[160px]">
                    <EditableCell
                      value={filing.status ?? ""}
                      onCommit={(v) => updateStatus(filing.id, v)}
                    />
                  </td>

                  {/* ✅ FIXED: Payment converted from Dropdown to fully open Editable Text Row */}
                  <td className="px-1 py-1 border-r border-gray-100 min-w-[120px]">
                    <EditableCell
                      value={filing.payment_status ?? ""}
                      onCommit={(v) => updatePayment(filing.id, v)}
                    />
                  </td>

                  {/* ── CUSTOM CELLS (admin-editable, click to edit) ── */}
                  {customColumns.map((col) => (
                    <td key={col.field_key} className="px-1 py-1 border-r border-gray-100 min-w-[120px]">
                      <EditableCell
                        value={filing.custom_fields?.[col.field_key] ?? ""}
                        onCommit={(v) => updateCustomField(filing.id, col.field_key, v)}
                      />
                    </td>
                  ))}

                  {/* Workspace link */}
                  <td className="px-2 py-2 min-w-[90px]">
                    <Link to={`/filings/${filing.id}`}>
                      <button className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* ── LEGEND ── */}
      <p className="text-xs text-gray-400 text-right">
        Status & Payment columns are visible to customers in their app. Click any cell to rewrite values.
      </p>

    </div>
  );
}