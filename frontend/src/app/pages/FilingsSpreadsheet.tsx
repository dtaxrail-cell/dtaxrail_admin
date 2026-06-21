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
    celldata.push(makeCell(r, 6, filing.status         ?? ""));
    celldata.push(makeCell(r, 7, filing.payment_status ?? ""));
    
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

  const sheetDataRef     = useRef<any[] | null>(null);
  const filingsRef       = useRef<Filing[]>([]);
  const customColumnsRef = useRef<CustomColumn[]>([]);

  useEffect(() => { sheetDataRef.current     = sheetData;     }, [sheetData]);
  useEffect(() => { filingsRef.current       = filings;       }, [filings]);
  useEffect(() => { customColumnsRef.current = customColumns; }, [customColumns]);

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  // ── fetch — always rebuilds from live DB data ──────────────────────────────

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
      const allCelldata: any[] = sheet.celldata ?? [];

      // 1. Compile map of existing cells for accurate lookup
      const cellMap = new Map<string, string>();
      allCelldata.forEach((cell: any) => {
        if (!cell) return;
        const val = String(cell.v?.v ?? cell.v?.m ?? "").trim();
        cellMap.set(`${cell.r},${cell.c}`, val);
      });

      // 2. Scan and commit changes across the structured filing data rows
      for (let rIdx = 0; rIdx < currentFilings.length; rIdx++) {
        const r = rIdx + 1;
        const filing = currentFilings[rIdx];

        // Check Status changes (Column 6)
        const statusVal = cellMap.get(`${r},6`) ?? "";
        if (statusVal !== String(filing.status ?? "")) {
          await fetch(`${API_BASE_URL}/filings/status/${filing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
            body: JSON.stringify({ status: statusVal }),
          });
        }

        // Check Payment status changes (Column 7)
        const paymentVal = cellMap.get(`${r},7`) ?? "";
        if (paymentVal !== String(filing.payment_status ?? "")) {
          await fetch(`${API_BASE_URL}/filings/payment/${filing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
            body: JSON.stringify({ payment_status: paymentVal }),
          });
        }

        // Check and capture Custom field data changes/deletions
        for (let cIdx = 0; cIdx < currentCustomCols.length; cIdx++) {
          const colDef = currentCustomCols[cIdx];
          const c = totalFixedCount + cIdx;
          const currentCellVal = cellMap.get(`${r},${c}`) ?? "";
          const oldCellVal = String(filing.custom_fields?.[colDef.field_key] ?? "");

          if (currentCellVal !== oldCellVal) {
            await fetch(`${API_BASE_URL}/filings/custom-field/${filing.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
              body: JSON.stringify({ field_key: colDef.field_key, value: currentCellVal }),
            });
          }
        }
      }

      // 3. Keep manual notes positioned entirely outside data range bounds
      const extraCelldata = allCelldata
        .filter((c: any) => c.r >= dataRowCount || c.c >= totalDataCols)
        .map((c: any) => ({
          r: c.r,
          c: c.c,
          v: c.v?.v ?? c.v?.m ?? String(c.v ?? ""),
        }));

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

      const res = await fetch(`${API_BASE_URL}/filings/sheet-layout`, {
        method  : "PUT",
        headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body    : JSON.stringify({ layout: { prefs } }),
      });
      const data = await res.json();

      setSaveMsg(data.success ? "saved" : "error");
      
      // Clean reload to pull updated database states securely
      await fetchData(); 
    } catch (e) {
      console.error("Save failure details:", e);
      setSaveMsg("error");
    } {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
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

  // ── handle sheet cell adjustments locally ───────────────────────────────────

  const handleCellChange = (newData: any[]) => {
    if (!newData || !newData[0]) return;
    
    const currentCustomCols = customColumnsRef.current;
    const totalFixedCount   = FIXED_COLS.length;
    const updatedCelldata: any[] = newData[0]?.celldata ?? [];

    // Detect headers typed into the next empty header field
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
          {filings.length === 0 && <span className="text-xs text-gray-400">No filings yet.</span>}
        </div>
      </div>
    </div>
  );
}