import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Save, Loader2, Search } from "lucide-react";
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
  relationship: string | null;   // ← NEW: relationship entered when member was created
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

// ── NEW: Relationship added as a fixed column ─────────────────────────────────
// Plain data column, sourced from the member's record (entered when the
// member was created in the customer app).
const FIXED_COLS = [
  { key: "member_name",     label: "Full Name"    },
  { key: "member_pan",      label: "PAN"          },
  { key: "member_password", label: "Password"     },
  { key: "member_phone",    label: "Phone"        },
  { key: "member_email",    label: "Email"        },
  { key: "member_dob",      label: "DOB"          },
  { key: "relationship",    label: "Relationship" }, // ← NEW
  { key: "status",          label: "Status"       },
  { key: "payment_status",  label: "Payment"      },
] as const;

// Index helpers so the rest of the code doesn't need to hardcode positions
const COL_RELATIONSHIP = FIXED_COLS.findIndex((c) => c.key === "relationship");
const COL_STATUS       = FIXED_COLS.findIndex((c) => c.key === "status");
const COL_PAYMENT      = FIXED_COLS.findIndex((c) => c.key === "payment_status");

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


// ─── build sheet — always from live DB data + saved layout prefs ──────────────

function buildSheet(
  fetchedFilings: Filing[],
  fetchedCustomCols: CustomColumn[],
  savedPrefs: {
    config?: any;
    extraCelldata?: any[];
    totalRows?: number;
    totalCols?: number;
  }
) {
  const totalDataCols = FIXED_COLS.length + fetchedCustomCols.length;
  const celldata: any[] = [];


  // ── header row ──────────────────────────────────────────────────────────────
  FIXED_COLS.forEach((col, colIdx) => {
    celldata.push(makeCell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6", fc: "#1f2937", ht: 1, vt: 1 }));
  });
  fetchedCustomCols.forEach((col, colIdx) => {
    celldata.push(makeCell(0, FIXED_COLS.length + colIdx, col.label, { bl: 1, bg: "#eff6ff", fc: "#1e40af", ht: 1, vt: 1 }));
  });

  // ── data rows (always from live DB) ─────────────────────────────────────────
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
    // ── NEW: Relationship, exactly as entered when the member was created ────
    celldata.push(makeCell(r, COL_RELATIONSHIP, filing.relationship ?? ""));

    celldata.push(makeCell(r, COL_STATUS,  filing.status         ?? ""));
    celldata.push(makeCell(r, COL_PAYMENT, filing.payment_status ?? ""));

    fetchedCustomCols.forEach((col, cIdx) => {
      celldata.push(makeCell(r, FIXED_COLS.length + cIdx,
        filing.custom_fields?.[col.field_key] ?? ""
      ));
    });
  });

  // ── restore extra cells below data (admin's manual notes in blank rows) ─────
  const dataRowCount = fetchedFilings.length + 1;
  const extraCells = (savedPrefs.extraCelldata ?? [])
    .filter((c: any) => c.r >= dataRowCount || c.c >= totalDataCols)
    .map((c: any) => makeCell(c.r, c.c, c.v?.v ?? c.v?.m ?? String(c.v ?? "")));

  const allCelldata = [...celldata, ...extraCells];

  // ── dimensions ──────────────────────────────────────────────────────────────
  const totalRows = Math.max(
    fetchedFilings.length + 30,
    50,
    savedPrefs.totalRows ?? 0
  );
  const totalCols = Math.max(
    totalDataCols + 12,
    30,
    savedPrefs.totalCols ?? 0
  );

  return [{
    name: "Filings Matrix",
    id: "sheet-1",
    status: 1,
    order: 0,
    hide: 0,
    row: totalRows,
    column: totalCols,
    celldata: allCelldata,
    config: {
      rowlen:    savedPrefs.config?.rowlen    ?? {},
      columnlen: savedPrefs.config?.columnlen ?? {},
      merge:     savedPrefs.config?.merge     ?? {},
    },
    zoomRatio: 1,
    showGridLines: 1,
    defaultRowHeight: 24,
    defaultColWidth: 100,
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
}

// ─── main component ───────────────────────────────────────────────────────────

export function FilingsSpreadsheet() {
  const [filings,       setFilings      ] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns ] = useState<CustomColumn[]>([]);
  const [loading,       setLoading      ] = useState(true);
  const [saving,        setSaving       ] = useState(false);
  const [saveMsg,       setSaveMsg      ] = useState<"saved" | "error" | null>(null);
  const [sheetData,     setSheetData    ] = useState<any[] | null>(null);
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  const sheetDataRef     = useRef<any[] | null>(null);
  const filingsRef       = useRef<Filing[]>([]);
  const customColumnsRef = useRef<CustomColumn[]>([]);

  useEffect(() => { sheetDataRef.current     = sheetData;     }, [sheetData]);
  useEffect(() => { filingsRef.current       = filings;       }, [filings]);
  useEffect(() => { customColumnsRef.current = customColumns; }, [customColumns]);

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  const fetchData = async () => {
    try {
      const tok = await token();

      const [filingsRes, layoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/filings?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
        fetch(`${API_BASE_URL}/filings/sheet-layout?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
      ]);

      const filingsData = await filingsRes.json();
      const layoutData  = await layoutRes.json();

      if (filingsData.success) {
        const fetchedFilings: Filing[]          = filingsData.filings      ?? [];
        const fetchedCustomCols: CustomColumn[] = filingsData.customColumns ?? [];
        const savedPrefs = layoutData?.success ? (layoutData.layout?.prefs ?? {}) : {};

        setFilings(fetchedFilings);
        setCustomColumns(fetchedCustomCols);
        setSheetData(buildSheet(fetchedFilings, fetchedCustomCols, savedPrefs));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Save handler — Persists all cell modifications and layout properties ────

  const handleSave = async () => {
    const current = sheetDataRef.current;
    if (!current) return;

    setSaving(true);
    setSaveMsg(null);

    try {
      const sheet = current[0];
      if (!sheet) return;

      const tok = await token();
      const currentFilings = filingsRef.current;
      const currentCustomCols = customColumnsRef.current;
      const totalFixedCount = FIXED_COLS.length;
      const dataRowCount = currentFilings.length + 1;
      const totalDataCols = totalFixedCount + currentCustomCols.length;

      // Access the real-time 2D data grid array populated by FortuneSheet edits
      const liveGrid = sheet.data;
      const updates: any[] = [];

      if (liveGrid) {
        for (let rIdx = 0; rIdx < currentFilings.length; rIdx++) {
          const r = rIdx + 1;
          const filing = currentFilings[rIdx];

          // 1. Status Check
          const statusCell = liveGrid[r]?.[COL_STATUS];
          const statusVal = String(statusCell?.v ?? statusCell?.m ?? "").trim();
          if (statusVal !== String(filing.status ?? "")) {
            updates.push({ filingId: filing.id, type: "status", value: statusVal });
          }

          // 2. Payment Status Check
          const paymentCell = liveGrid[r]?.[COL_PAYMENT];
          const paymentVal = String(paymentCell?.v ?? paymentCell?.m ?? "").trim();
          if (paymentVal !== String(filing.payment_status ?? "")) {
            updates.push({ filingId: filing.id, type: "payment", value: paymentVal });
          }

          // NOTE: Relationship and Workspace columns are intentionally NOT
          // diffed/saved here. Relationship is sourced from the member's
          // own record (edited via Members screen, not this sheet) and
          // Workspace is a generated hyperlink, not real data — editing
          // either of those cells in the grid has no backend effect.

          // 3. Custom Field Columns Check (Handles deletions accurately)
          for (let cIdx = 0; cIdx < currentCustomCols.length; cIdx++) {
            const colDef = currentCustomCols[cIdx];
            const c = totalFixedCount + cIdx;
            const customCell = liveGrid[r]?.[c];

            const currentCellVal = String(customCell?.v ?? customCell?.m ?? "").trim();

            const rawOldVal = filing.custom_fields?.[colDef.field_key];
            const oldCellVal = rawOldVal ? String(rawOldVal).trim() : "";

            if (currentCellVal !== oldCellVal) {
              updates.push({
                filingId: filing.id,
                type: "custom_field",
                field_key: colDef.field_key,
                value: currentCellVal
              });
            }
          }
        }
      }

      // Collect notes from the rest of the sheet grid safely
      const allCelldata: any[] = sheet.celldata ?? [];
      const extraCelldata = anonymityFilter(allCelldata, dataRowCount, totalDataCols, liveGrid);

      const prefs = {
        config: {
          rowlen:    sheet.config?.rowlen    ?? {},
          columnlen: sheet.config?.columnlen ?? {},
          merge:     sheet.config?.merge     ?? {},
        },
        extraCelldata,
        totalRows: sheet.row    ?? 50,
        totalCols: sheet.column ?? 30,
      };

      // Fire both bulk dataset updates and layout adjustments simultaneously
      const [dataRes, layoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/filings/bulk-update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ updates }),
        }),
        fetch(`${API_BASE_URL}/filings/sheet-layout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body: JSON.stringify({ layout: { prefs } }),
        })
      ]);

      const dataResult = await dataRes.json();
      const layoutResult = await layoutRes.json();

      setSaveMsg(dataResult.success && layoutResult.success ? "saved" : "error");
      await fetchData();
    } catch (e) {
      console.error("Save failed:", e);
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  // Helper parsing function to scan cell objects
  const anonymityFilter = (celldata: any[], dataRowCount: number, totalDataCols: number, liveGrid: any[][]) => {
    const extra: any[] = [];
    if (liveGrid) {
      for (let r = 0; r < liveGrid.length; r++) {
        for (let c = 0; c < (liveGrid[r]?.length ?? 0); c++) {
          if (r >= dataRowCount || c >= totalDataCols) {
            const cell = liveGrid[r][c];
            if (cell && (cell.v !== undefined || cell.m !== undefined)) {
              extra.push({ r, c, v: String(cell.v ?? cell.m ?? "") });
            }
          }
        }
      }
    } else {
      celldata.forEach((c: any) => {
        if (c.r >= dataRowCount || c.c >= totalDataCols) {
          extra.push({ r: c.r, c: c.c, v: String(c.v?.v ?? c.v?.m ?? "") });
        }
      });
    }
    return extra;
  };

  const addColumnBackend = async (label: string) => {
    try {
      const tok = await token();
      const res  = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      return data?.success ? data.column : null;
    } catch (e) { console.error(e); return null; }
  };

  const deleteColumnBackend = async (field_key: string) => {
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/custom-columns/${field_key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tok}` },
      });
    } catch (e) { console.error(e); }
  };

  const handleCellChange = (newData: any[]) => {
    if (!newData || !newData[0]) return;

    const currentCustomCols = customColumnsRef.current;
    const totalFixedCount   = FIXED_COLS.length;
    const updatedCelldata: any[] = newData[0]?.celldata ?? [];

    const firstBlankCustomColIdx = totalFixedCount + currentCustomCols.length;
    const headerCell = updatedCelldata.find((c: any) => c.r === 0 && c.c === firstBlankCustomColIdx);
    const maybeNewLabel = String(headerCell?.v?.v ?? headerCell?.v?.m ?? "").trim();

    if (maybeNewLabel) {
      addColumnBackend(maybeNewLabel).then((col) => {
        if (col) fetchData();
      });
    }

    setSheetData(newData);
  };

  const handleOp = useCallback(async (ops: any[]) => {
    let columnDeleted = false;
    for (const op of ops) {
      if (op?.op === "deleteRowCol" && op.value?.type === "column") {
        const startCol = op.value.index;
        const count    = op.value.count ?? 1;
        const cols     = customColumnsRef.current;

        for (let c = startCol; c < startCol + count; c++) {
          const customIdx = c - FIXED_COLS.length;
          if (customIdx < 0) continue;
          const colToDelete = cols[customIdx];
          if (colToDelete) {
            await deleteColumnBackend(colToDelete.field_key);
            columnDeleted = true;
          }
        }
      }
    }
    if (columnDeleted) {
      sheetDataRef.current = null;
      await fetchData();
    }
  }, []);

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [...FIXED_COLS.map((c) => c.label), ...customColumns.map((c) => c.label)];
    const rows = filings.map((f) => [
      f.member_name ?? "", f.member_pan ?? "", f.member_password ?? "",
      f.member_phone ?? "", f.member_email ?? "",
      f.member_dob ? new Date(f.member_dob).toLocaleDateString("en-IN") : "",
      f.relationship ?? "",
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saveMsg === "saved" ? "Saved ✓" : saveMsg === "error" ? "Error — Retry" : "Save Layout & Changes"}
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 font-medium">
        💾 Click <strong>Save Layout & Changes</strong> to store cell edits, custom field modifications, deleted notes, or size updates securely to the database.
      </p>

      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden"
        style={{ height: "calc(100vh - 260px)", minHeight: "550px", width: "100%" }}
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

      {/* ── Open Customer Workspace — reliable real <Link> buttons ──────────────
          NOTE: We tried making the last spreadsheet column itself clickable
          via FortuneSheet's native hyperlink feature, but it froze the page
          (likely choking trying to handle the UUID-based link address
          internally). Real React Router links here are 100% reliable and
          a search box keeps it fast to use even with many filings. */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-sm font-bold text-text-dark">Open Customer Workspace</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={workspaceSearch}
              onChange={(e) => setWorkspaceSearch(e.target.value)}
              placeholder="Search by name or PAN..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filings
            .filter((f) =>
              `${f.member_name || "Unnamed"} ${f.member_pan || ""}`
                .toLowerCase()
                .includes(workspaceSearch.trim().toLowerCase())
            )
            .map((f) => (
              <Link key={f.id} to={`/filings/${f.id}`}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {f.member_name || "Unnamed"}{f.member_pan ? ` (${f.member_pan})` : ""} · Open
                </button>
              </Link>
            ))}
          {filings.length === 0 && <span className="text-xs text-gray-400">No filings yet.</span>}
          {filings.length > 0 &&
            filings.filter((f) =>
              `${f.member_name || "Unnamed"} ${f.member_pan || ""}`
                .toLowerCase()
                .includes(workspaceSearch.trim().toLowerCase())
            ).length === 0 && (
              <span className="text-xs text-gray-400">No matching customers found.</span>
            )}
        </div>
      </div>
    </div>
  );
}