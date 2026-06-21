import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download } from "lucide-react";
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

const COLUMN_BUFFER = 10;

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
  const [sheetData,     setSheetData    ] = useState<any[] | null>(null);

  // Holds the latest saved layout so we can merge it on every rebuild
  const savedLayoutRef = useRef<Record<string, any>>({});

  // Track current custom columns in a ref so callbacks always see latest value
  const customColumnsRef = useRef<CustomColumn[]>([]);
  useEffect(() => { customColumnsRef.current = customColumns; }, [customColumns]);

  // Track current filings in a ref for callbacks
  const filingsRef = useRef<Filing[]>([]);
  useEffect(() => { filingsRef.current = filings; }, [filings]);

  // ── token helper ────────────────────────────────────────────────────────────

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  // ── build FortuneSheet sheet ─────────────────────────────────────────────────

  const buildSheet = (
    fetchedFilings: Filing[],
    fetchedCustomCols: CustomColumn[],
    layout: Record<string, any>
  ) => {
    const totalDataCols = FIXED_COLS.length + fetchedCustomCols.length;
    const celldata: any[] = [];

    // Header row
    FIXED_COLS.forEach((col, colIdx) => {
      celldata.push(makeCell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6" }));
    });
    fetchedCustomCols.forEach((col, colIdx) => {
      celldata.push(makeCell(0, FIXED_COLS.length + colIdx, col.label, { bl: 1, bg: "#eff6ff" }));
    });

    // Data rows
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
        const val = filing.custom_fields?.[col.field_key] ?? "";
        celldata.push(makeCell(r, FIXED_COLS.length + cIdx, val));
      });
    });

    // ── restore extra rows / cells the admin typed below data ────────────────
    // Saved as a flat celldata array — filter to rows beyond current data
    const dataRowCount = fetchedFilings.length + 1;
    const savedCelldata: any[] = Array.isArray(layout.celldata) ? layout.celldata : [];
    const extraCells = savedCelldata.filter((c: any) => c.r >= dataRowCount);
    const allCelldata = [...celldata, ...extraCells];

    // Figure out dimensions from saved layout so we don't shrink the sheet
    const savedMaxRow = savedCelldata.reduce((m: number, c: any) => Math.max(m, c.r), 0);
    const savedMaxCol = savedCelldata.reduce((m: number, c: any) => Math.max(m, c.c), 0);
    const layoutMaxCol = layout.config?.columnlen
      ? Math.max(...Object.keys(layout.config.columnlen).map(Number), 0)
      : 0;

    const totalRows = Math.max(fetchedFilings.length + 20, 40, savedMaxRow + 5);
    const totalCols = Math.max(totalDataCols + COLUMN_BUFFER, savedMaxCol + 5, layoutMaxCol + 5, 30);

    return [
      {
        name: "Filings Matrix",
        id: "sheet-1",
        color: "",
        status: 1,
        order: 0,
        hide: 0,
        row: totalRows,
        column: totalCols,
        celldata: allCelldata,
        config: {
          rowlen:    layout.config?.rowlen    ?? {},
          columnlen: layout.config?.columnlen ?? {},
          merge:     layout.config?.merge     ?? {},
        },
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
        zoomRatio: 1,
        image: [],
        showGridLines: 1,
        defaultRowHeight: 19,
        defaultColWidth: 73,
      },
    ];
  };

  // ── fetch ────────────────────────────────────────────────────────────────────

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

      const data       = await filingsRes.json();
      const layoutData = await layoutRes.json();

      if (data.success) {
        const fetchedFilings: Filing[]       = data.filings      ?? [];
        const fetchedCustomCols: CustomColumn[] = data.customColumns ?? [];
        const layout = layoutData?.success ? (layoutData.layout ?? {}) : {};

        savedLayoutRef.current = layout;

        setFilings(fetchedFilings);
        setCustomColumns(fetchedCustomCols);
        setSheetData(buildSheet(fetchedFilings, fetchedCustomCols, layout));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── persist layout ───────────────────────────────────────────────────────────
  // KEY FIX: read from sheet.celldata (always populated) NOT sheet.data (often sparse)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistLayout = useCallback((newData: any[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const sheet = newData[0];
        if (!sheet) return;

        // FortuneSheet reliably populates `celldata` (sparse format)
        // but `data` (matrix format) is often undefined for blank rows
        const celldata: any[] = Array.isArray(sheet.celldata)
          ? sheet.celldata.map((c: any) => ({
              r: c.r,
              c: c.c,
              v: String(c.v?.v ?? c.v?.m ?? ""),
            }))
          : [];

        const layout = {
          config: {
            rowlen:    sheet.config?.rowlen    ?? {},
            columnlen: sheet.config?.columnlen ?? {},
            merge:     sheet.config?.merge     ?? {},
          },
          celldata, // save full flat celldata — extra rows included automatically
        };

        savedLayoutRef.current = layout;

        const tok = await token();
        await fetch(`${API_BASE_URL}/filings/sheet-layout`, {
          method  : "PUT",
          headers : { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
          body    : JSON.stringify({ layout }),
        });
      } catch (e) {
        console.error(e);
      }
    }, 600);
  }, []);

  // ── cell value changes ───────────────────────────────────────────────────────

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

  // ── add/delete custom column backend calls ───────────────────────────────────

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
    // KEY FIX: return the promise so callers can await it
    try {
      const tok = await token();
      await fetch(`${API_BASE_URL}/filings/custom-columns/${field_key}`, {
        method  : "DELETE",
        headers : { Authorization: `Bearer ${tok}` },
      });
    } catch (e) { console.error(e); }
  };

  // ── onChange ─────────────────────────────────────────────────────────────────

  const handleCellChange = (newData: any[]) => {
    if (!sheetData) return;

    const updatedCelldata: any[] = newData[0]?.celldata ?? [];
    const currentFilings  = filingsRef.current;
    const currentCustomCols = customColumnsRef.current;
    const totalFixedCount = FIXED_COLS.length;

    // Check if a new header was typed in the first blank custom-col slot
    const firstBlankCustomColIdx = totalFixedCount + currentCustomCols.length;
    const headerCell = updatedCelldata.find(
      (c: any) => c.r === 0 && c.c === firstBlankCustomColIdx
    );
    const maybeNewLabel = String(headerCell?.v?.v ?? headerCell?.v?.m ?? "").trim();

    if (maybeNewLabel) {
      addColumnBackend(maybeNewLabel).then((col) => {
        if (col) fetchData();
      });
    }

    // Diff editable cells (status, payment, custom fields)
    updatedCelldata.forEach((cellItem: any) => {
      const { r, c } = cellItem;
      if (r === 0) return; // header row — not a data cell
      const filingForRow = currentFilings[r - 1];
      if (!filingForRow) return;

      const newVal = String(cellItem.v?.v ?? cellItem.v?.m ?? "");

      if (c < totalFixedCount) {
        const fieldKey = FIXED_COLS[c].key as string;
        const oldVal   = String((filingForRow as any)[fieldKey] ?? "");
        if (oldVal === newVal) return;
        if (fieldKey === "status")         updateStatus(filingForRow.id, newVal);
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
    persistLayout(newData); // save celldata + config on every change
  };

  // ── onOp — handle right-click column delete ───────────────────────────────────
  // KEY FIX: await deleteColumnBackend before calling fetchData

  const handleOp = useCallback(async (ops: any[]) => {
    for (const op of ops) {
      if (op?.op === "deleteRowCol") {
        const value = op.value;
        if (!value || value.type !== "column") continue;

        const startCol = value.index;
        const count    = value.count ?? 1;
        const currentCustomCols = customColumnsRef.current;

        for (let c = startCol; c < startCol + count; c++) {
          const customIdx = c - FIXED_COLS.length;
          if (customIdx < 0) continue; // fixed columns can't be deleted
          const colToDelete = currentCustomCols[customIdx];
          if (colToDelete) {
            // KEY FIX: await so the DELETE finishes before we refetch
            await deleteColumnBackend(colToDelete.field_key);
          }
        }

        // Now safe to refetch — deletion is already committed
        fetchData();
      }
    }
  }, []);

  // ── excel export ──────────────────────────────────────────────────────────────

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [...FIXED_COLS.map((c) => c.label), ...customColumns.map((c) => c.label)];

    const rows = filings.map((f) => [
      f.member_name     ?? "",
      f.member_pan      ?? "",
      f.member_password ?? "",
      f.member_phone    ?? "",
      f.member_email    ?? "",
      f.member_dob ? new Date(f.member_dob).toLocaleDateString("en-IN") : "",
      f.status          ?? "",
      f.payment_status  ?? "",
      ...customColumns.map((c) => f.custom_fields?.[c.field_key] ?? ""),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h, colIdx) => ({
      wch: Math.min(
        Math.max(h.length, ...rows.map((r) => String(r[colIdx] ?? "").length)) + 2,
        40
      ),
    }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filings");
    XLSX.writeFile(wb, `DTaxRail_Filings_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── render ────────────────────────────────────────────────────────────────────

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
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden"
        style={{ height: "calc(100vh - 220px)", minHeight: "500px", width: "100%" }}
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

      {/* Workspace links below sheet */}
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
        Status & Payment updates sync with customers. Type a new column name in a blank header cell to add it. Right-click a custom column header → Delete Column to remove it.
      </p>

    </div>
  );
}