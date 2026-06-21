import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Save, Loader2 } from "lucide-react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
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

function makeCell(r: number, c: number, value: string, extra: Record<string, any> = {}) {
  return {
    r,
    c,
    v: {
      v: value,
      m: value,
      ct: { fa: "General", t: "g" },
      ...extra,
    },
  };
}

export function FilingsSpreadsheet() {
  const [filings,       setFilings      ] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading,       setLoading      ] = useState(true);
  const [saving,        setSaving       ] = useState(false);
  const [saveMsg,       setSaveMsg      ] = useState<"saved" | "error" | null>(null);
  const [sheetData,     setSheetData    ] = useState<any[] | null>(null);

  // Always-current refs for use inside callbacks
  const sheetDataRef     = useRef<any[] | null>(null);
  const filingsRef       = useRef<Filing[]>([]);
  const customColumnsRef = useRef<CustomColumn[]>([]);

  useEffect(() => { sheetDataRef.current     = sheetData;     }, [sheetData]);
  useEffect(() => { filingsRef.current       = filings;       }, [filings]);
  useEffect(() => { customColumnsRef.current = customColumns; }, [customColumns]);

  // ── token ──────────────────────────────────────────────────────────────────

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  // ── build sheet from DB data + saved snapshot ──────────────────────────────

  const buildSheet = (
    fetchedFilings: Filing[],
    fetchedCustomCols: CustomColumn[],
    snapshot: any[] | null   // full FortuneSheet sheet array saved by admin
  ) => {
    // If a saved snapshot exists, restore it directly — admin's layout wins
    if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
      return snapshot;
    }

    // No saved snapshot — build fresh from DB data
    const celldata: any[] = [];

    FIXED_COLS.forEach((col, colIdx) => {
      celldata.push(makeCell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6" }));
    });
    fetchedCustomCols.forEach((col, colIdx) => {
      celldata.push(makeCell(0, FIXED_COLS.length + colIdx, col.label, { bl: 1, bg: "#eff6ff" }));
    });

    fetchedFilings.forEach((filing, rIdx) => {
      const r = rIdx + 1;
      celldata.push(makeCell(r, 0, filing.member_name     ?? ""));
      celldata.push(makeCell(r, 1, filing.member_pan      ?? ""));
      celldata.push(makeCell(r, 2, filing.member_password ?? ""));
      celldata.push(makeCell(r, 3, filing.member_phone    ?? ""));
      celldata.push(makeCell(r, 4, filing.member_email    ?? ""));
      celldata.push(makeCell(r, 5,
        filing.member_dob
          ? new Date(filing.member_dob).toLocaleDateString("en-IN")
          : ""
      ));
      celldata.push(makeCell(r, 6, filing.status         ?? ""));
      celldata.push(makeCell(r, 7, filing.payment_status ?? ""));
      fetchedCustomCols.forEach((col, cIdx) => {
        celldata.push(makeCell(r, FIXED_COLS.length + cIdx, filing.custom_fields?.[col.field_key] ?? ""));
      });
    });

    const totalCols = FIXED_COLS.length + fetchedCustomCols.length + 10;
    const totalRows = Math.max(fetchedFilings.length + 20, 40);

    return [{
      name: "Filings Matrix",
      id: "sheet-1",
      status: 1,
      order: 0,
      hide: 0,
      row: totalRows,
      column: totalCols,
      celldata,
      config: {},
      zoomRatio: 1,
      showGridLines: 1,
      defaultRowHeight: 19,
      defaultColWidth: 73,
      scrollLeft: 0,
      scrollTop: 0,
      luckysheet_select_save: [],
      calcChain: [],
      isPivotTable: false,
      pivotTable: {},
      filter_select: {},
      filter: null,
      luckysheet_conditionformat_save: [],
      luckysheet_alternateformat_save: [],
      dataVerification: {},
      hyperlink: {},
      luckysheet_freezen: {},
      image: [],
    }];
  };

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const tok = await token();

      const [filingsRes, snapshotRes] = await Promise.all([
        fetch(`${API_BASE_URL}/filings?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
        fetch(`${API_BASE_URL}/filings/sheet-layout?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
      ]);

      const data         = await filingsRes.json();
      const snapshotData = await snapshotRes.json();

      if (data.success) {
        const fetchedFilings: Filing[]          = data.filings      ?? [];
        const fetchedCustomCols: CustomColumn[] = data.customColumns ?? [];

        // snapshot is the full FortuneSheet array saved by admin
        const snapshot: any[] | null = snapshotData?.success
          ? (snapshotData.layout?.snapshot ?? null)
          : null;

        setFilings(fetchedFilings);
        setCustomColumns(fetchedCustomCols);
        setSheetData(buildSheet(fetchedFilings, fetchedCustomCols, snapshot));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── SAVE BUTTON — snapshots entire current sheet state ────────────────────
  // This is the single source of truth for persistence.
  // Saves the full FortuneSheet data array (celldata, config, row/col counts).

  const handleSave = async () => {
    const current = sheetDataRef.current;
    if (!current) return;

    setSaving(true);
    setSaveMsg(null);

    try {
      const tok = await token();

      // Serialize the full sheet — this is everything FortuneSheet needs to restore
      const layout = { snapshot: current };

      const res  = await fetch(`${API_BASE_URL}/filings/sheet-layout`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ layout }),
      });
      const data = await res.json();

      setSaveMsg(data.success ? "saved" : "error");
    } catch (e) {
      console.error(e);
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  // ── cell value changes → sync to DB ───────────────────────────────────────

  const updateStatus = async (filingId: string, status: string) => {
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/status/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ status }),
      });
    } catch (e) { console.error(e); }
  };

  const updatePayment = async (filingId: string, payment_status: string) => {
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/payment/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ payment_status }),
      });
    } catch (e) { console.error(e); }
  };

  const updateCustomField = async (filingId: string, field_key: string, value: string) => {
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/custom-field/${filingId}`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ field_key, value }),
      });
    } catch (e) { console.error(e); }
  };

  const addColumnBackend = async (label: string) => {
    try {
      const tok = await token();
      const res  = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method  : "POST",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ label }),
      });
      const data = await res.json();
      return data?.success ? data.column : null;
    } catch (e) { console.error(e); return null; }
  };

  const deleteColumnBackend = async (field_key: string) => {
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/custom-columns/${field_key}`, {
        method  : "DELETE",
        headers : { Authorization: `Bearer ${tok}` },
      });
    } catch (e) { console.error(e); }
  };

  // ── onChange — diff editable cells and sync to DB ─────────────────────────

  const handleCellChange = (newData: any[]) => {
    const currentFilings     = filingsRef.current;
    const currentCustomCols  = customColumnsRef.current;
    const totalFixedCount    = FIXED_COLS.length;
    const updatedCelldata: any[] = newData[0]?.celldata ?? [];

    // Detect new header typed in first blank custom col slot
    const firstBlankCustomColIdx = totalFixedCount + currentCustomCols.length;
    const headerCell  = updatedCelldata.find((c: any) => c.r === 0 && c.c === firstBlankCustomColIdx);
    const maybeNewLabel = String(headerCell?.v?.v ?? headerCell?.v?.m ?? "").trim();
    if (maybeNewLabel) {
      addColumnBackend(maybeNewLabel).then((col) => {
        if (col) fetchData();
      });
    }

    // Diff status / payment / custom field values
    updatedCelldata.forEach((cellItem: any) => {
      const { r, c } = cellItem;
      if (r === 0) return;
      const filingForRow = currentFilings[r - 1];
      if (!filingForRow) return;

      const newVal = String(cellItem.v?.v ?? cellItem.v?.m ?? "");

      if (c < totalFixedCount) {
        const fieldKey = FIXED_COLS[c].key as string;
        const oldVal   = String((filingForRow as any)[fieldKey] ?? "");
        if (oldVal === newVal) return;
        if (fieldKey === "status")              updateStatus(filingForRow.id, newVal);
        else if (fieldKey === "payment_status") updatePayment(filingForRow.id, newVal);
      } else {
        const customIdx = c - totalFixedCount;
        const customKey = currentCustomCols[customIdx]?.field_key;
        if (!customKey) return;
        const oldVal = String(filingForRow.custom_fields?.[customKey] ?? "");
        if (oldVal === newVal) return;
        updateCustomField(filingForRow.id, customKey, newVal);
      }
    });

    setSheetData(newData);
  };

  // ── onOp — right-click column delete ──────────────────────────────────────

  const handleOp = useCallback(async (ops: any[]) => {
    for (const op of ops) {
      if (op?.op === "deleteRowCol" && op.value?.type === "column") {
        const startCol = op.value.index;
        const count    = op.value.count ?? 1;
        const cols     = customColumnsRef.current;

        for (let c = startCol; c < startCol + count; c++) {
          const customIdx = c - FIXED_COLS.length;
          if (customIdx < 0) continue;
          const colToDelete = cols[customIdx];
          if (colToDelete) await deleteColumnBackend(colToDelete.field_key);
        }

        // After deleting from DB, also save the current visual sheet state
        // so the column stays gone on refresh without needing a manual Save
        setTimeout(async () => {
          const current = sheetDataRef.current;
          if (!current) return;
          try {
            const tok = await token();
            await fetch(`${API_BASE_URL}/filings/sheet-layout`, {
              method  : "PUT",
              headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
              body    : JSON.stringify({ layout: { snapshot: current } }),
            });
          } catch (e) { console.error(e); }
          fetchData();
        }, 200);
      }
    }
  }, []);

  // ── excel export ───────────────────────────────────────────────────────────

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [...FIXED_COLS.map((c) => c.label), ...customColumns.map((c) => c.label)];
    const rows = filings.map((f) => [
      f.member_name ?? "", f.member_pan ?? "", f.member_password ?? "",
      f.member_phone ?? "", f.member_email ?? "",
      f.member_dob ? new Date(f.member_dob).toLocaleDateString("en-IN") : "",
      f.status ?? "", f.payment_status ?? "",
      ...customColumns.map((c) => f.custom_fields?.[c.field_key] ?? ""),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h, i) => ({
      wch: Math.min(Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2, 40),
    }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filings");
    XLSX.writeFile(wb, `DTaxRail_Filings_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading || !sheetData) {
    return (
      <div className="flex items-center justify-center h-64 text-text-mid font-medium">
        Loading spreadsheet...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Filings</h1>
          <p className="text-sm text-text-mid mt-0.5">
            {filings.length} filing{filings.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
              saveMsg === "saved"
                ? "bg-green-500 text-white"
                : saveMsg === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            {saving
              ? "Saving..."
              : saveMsg === "saved"
              ? "Saved ✓"
              : saveMsg === "error"
              ? "Error — Retry"
              : "Save"}
          </button>

          {/* EXPORT */}
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

        </div>
      </div>

      {/* hint */}
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 font-medium">
        💾 After adding/removing rows, columns, or making layout changes — click <strong>Save</strong> to persist them across refreshes.
      </p>

      {/* SHEET */}
      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden"
        style={{ height: "calc(100vh - 260px)", minHeight: "500px", width: "100%" }}
      >
        <Workbook
          data={sheetData}
          onChange={handleCellChange}
          onOp={handleOp}
          config={{
            showinfobar      : false,
            sheetFormulaBar  : true,
            showsheetbar     : false,
            enableAddRow     : true,
            enableAddBackTop : false,
          }}
        />
      </div>

      {/* Workspace links */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
        <h2 className="text-sm font-bold text-text-dark mb-3">Open Customer Workspace</h2>
        <div className="flex flex-wrap gap-2">
          {filings.map((f) => (
            <Link key={f.id} to={`/filings/${f.id}`}>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {f.member_name || "Unnamed"} · Open
              </button>
            </Link>
          ))}
          {filings.length === 0 && (
            <span className="text-xs text-gray-400">No filings yet.</span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right italic">
        Status & Payment updates sync with customers instantly. Right-click a column header → Delete Column to remove it, then Save.
      </p>

    </div>
  );
}