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

  const styleMap = new Map<string, any>();
  (savedPrefs.extraCelldata ?? []).forEach((cell: any) => {
    styleMap.set(`${cell.r},${cell.c}`, cell.s || {});
  });

  const celldata: any[] = [];

  FIXED_COLS.forEach((col, colIdx) => {
    const savedStyle = styleMap.get(`0,${colIdx}`) || {};
    celldata.push(makeCell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6", fc: "#1f2937", ht: 1, vt: 1, ...savedStyle }));
  });
  fetchedCustomCols.forEach((col, colIdx) => {
    const cIdx = FIXED_COLS.length + colIdx;
    const savedStyle = styleMap.get(`0,${cIdx}`) || {};
    celldata.push(makeCell(0, cIdx, col.label, { bl: 1, bg: "#eff6ff", fc: "#1e40af", ht: 1, vt: 1, ...savedStyle }));
  });

  fetchedFilings.forEach((filing, rIdx) => {
    const r = rIdx + 1;
    const getStyle = (c: number) => styleMap.get(`${r},${c}`) || {};

    celldata.push(makeCell(r, 0, filing.member_name     ?? "", getStyle(0)));
    celldata.push(makeCell(r, 1, filing.member_pan      ?? "", getStyle(1)));
    celldata.push(makeCell(r, 2, filing.member_password ?? "", getStyle(2)));
    celldata.push(makeCell(r, 3, filing.member_phone    ?? "", getStyle(3)));
    celldata.push(makeCell(r, 4, filing.member_email    ?? "", getStyle(4)));
    celldata.push(makeCell(r, 5,
      filing.member_dob ? new Date(filing.member_dob).toLocaleDateString("en-IN") : "",
      getStyle(5)
    ));
    celldata.push(makeCell(r, 6, filing.status         ?? "", getStyle(6)));
    celldata.push(makeCell(r, 7, filing.payment_status ?? "", getStyle(7)));

    fetchedCustomCols.forEach((col, cIdx) => {
      const c = FIXED_COLS.length + cIdx;
      celldata.push(makeCell(r, c, filing.custom_fields?.[col.field_key] ?? "", getStyle(c)));
    });
  });

  const dataRowCount = fetchedFilings.length + 1;
  (savedPrefs.extraCelldata ?? []).forEach((c: any) => {
    if (c.r >= dataRowCount || c.c >= totalDataCols) {
      celldata.push(makeCell(c.r, c.c, c.v ?? "", c.s || {}));
    }
  });

  const totalRows = Math.max(fetchedFilings.length + 30, 50, savedPrefs.totalRows ?? 0);
  const totalCols = Math.max(totalDataCols + 12, 30, savedPrefs.totalCols ?? 0);

  return [{
    name: "Filings Matrix",
    id: "sheet-1",
    status: 1,
    order: 0,
    hide: 0,
    row: totalRows,
    column: totalCols,
    celldata,
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
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading,       setLoading      ] = useState(true);
  const [saving,        setSaving       ] = useState(false);
  const [saveMsg,       setSaveMsg      ] = useState<"saved" | "error" | null>(null);
  const [sheetData,     setSheetData    ] = useState<any[] | null>(null);

  const sheetDataRef      = useRef<any[] | null>(null);
  const filingsRef        = useRef<Filing[]>([]);
  const customColumnsRef  = useRef<CustomColumn[]>([]);
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sheetDataRef.current     = sheetData;     }, [sheetData]);
  useEffect(() => { filingsRef.current       = filings;       }, [filings]);
  useEffect(() => { customColumnsRef.current = customColumns; }, [customColumns]);

  // ── Wheel event fix for FortuneSheet internal zoom ──────────────────────────
  // FortuneSheet has 3 zoom behaviour zones:
  //   ≤ 80%  : native overlay works fine — no intervention needed
  //   81-119%: overlay is partially misaligned — just preventDefault +
  //            stopPropagation is enough to stop page stealing events,
  //            FortuneSheet handles the rest itself
  //   ≥ 120% : overlay completely breaks — must manually drive the internal
  //            scrollbar divs directly
  // We read the current zoom from FortuneSheet's zoomRatio on the sheet data.
  useEffect(() => {
    const el = sheetContainerRef.current;
    if (!el) return;

    const getZoomPct = () => {
      // FortuneSheet stores zoomRatio as 0.8, 1.0, 1.2 etc on the sheet object
      const current = sheetDataRef.current;
      if (!current || !current[0]) return 100;
      return Math.round((current[0].zoomRatio ?? 1) * 100);
    };

    const onWheel = (e: WheelEvent) => {
      const zoom = getZoomPct();

      if (zoom <= 80) {
        // Native overlay works — let FortuneSheet handle it untouched
        return;
      }

      // For all zoom > 80 we must at minimum stop the page from scrolling
      e.preventDefault();
      e.stopPropagation();

      if (zoom >= 120) {
        // Overlay is fully broken — manually drive internal scroll containers
        const scrollY = el.querySelector<HTMLElement>(".luckysheet-scrollbar-y");
        const scrollX = el.querySelector<HTMLElement>(".luckysheet-scrollbar-x");

        if (scrollY && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
          scrollY.scrollTop += e.deltaY;
          scrollY.dispatchEvent(new Event("scroll", { bubbles: true }));
        } else if (scrollX) {
          scrollX.scrollLeft += e.deltaX;
          scrollX.dispatchEvent(new Event("scroll", { bubbles: true }));
        }
      }
      // 81–119%: preventDefault + stopPropagation above is sufficient —
      // FortuneSheet's partially-working overlay takes it from here
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  const fetchData = async () => {
    try {
      const tok = await token();
      const [filingsRes, layoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/filings?_ts=${Date.now()}`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API_BASE_URL}/filings/sheet-layout?_ts=${Date.now()}`, { headers: { Authorization: `Bearer ${tok}` } }),
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

  const handleSave = async () => {
    const current = sheetDataRef.current;
    if (!current) return;

    setSaving(true);
    setSaveMsg(null);

    try {
      const sheet = current[0];
      if (!sheet) return;

      const tok = await token();
      const currentFilings    = filingsRef.current;
      const currentCustomCols = customColumnsRef.current;
      const totalFixedCount   = FIXED_COLS.length;
      const liveGrid = sheet.data;

      const updates: any[]       = [];
      const extraCelldata: any[] = [];

      if (liveGrid) {
        for (let r = 0; r < liveGrid.length; r++) {
          const rowCells = liveGrid[r];
          if (!rowCells) continue;

          for (let c = 0; c < rowCells.length; c++) {
            const cell = rowCells[c];
            if (!cell) continue;

            const val = String(cell.v ?? cell.m ?? "").trim();

            const styleObj: Record<string, any> = {};
            if (cell.bl) styleObj.bl = cell.bl;
            if (cell.it) styleObj.it = cell.it;
            if (cell.ff) styleObj.ff = cell.ff;
            if (cell.fs) styleObj.fs = cell.fs;
            if (cell.fc) styleObj.fc = cell.fc;
            if (cell.bg) styleObj.bg = cell.bg;
            if (cell.ht) styleObj.ht = cell.ht;
            if (cell.vt) styleObj.vt = cell.vt;
            if (cell.un) styleObj.un = cell.un;
            if (cell.cl) styleObj.cl = cell.cl;

            const isHeaderRow        = r === 0;
            const isWithinFilingRows = r > 0 && r <= currentFilings.length;
            const isCoreDataColumn   = c < totalFixedCount + currentCustomCols.length;

            if (isHeaderRow || (isWithinFilingRows && isCoreDataColumn)) {
              extraCelldata.push({ r, c, v: isHeaderRow ? val : undefined, s: styleObj });

              if (isWithinFilingRows) {
                const filing = currentFilings[r - 1];
                if (filing) {
                  if (c === 6 && val !== String(filing.status ?? "")) {
                    updates.push({ filingId: filing.id, type: "status", value: val });
                  } else if (c === 7 && val !== String(filing.payment_status ?? "")) {
                    updates.push({ filingId: filing.id, type: "payment", value: val });
                  } else if (c >= totalFixedCount) {
                    const colDef = currentCustomCols[c - totalFixedCount];
                    if (colDef) {
                      const oldVal = filing.custom_fields?.[colDef.field_key]
                        ? String(filing.custom_fields[colDef.field_key]).trim()
                        : "";
                      if (val !== oldVal) {
                        updates.push({ filingId: filing.id, type: "custom_field", field_key: colDef.field_key, value: val });
                      }
                    }
                  }
                }
              }
            } else {
              if (val || Object.keys(styleObj).length > 0) {
                extraCelldata.push({ r, c, v: val, s: styleObj });
              }
            }
          }
        }
      }

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
        }),
      ]);

      const dataResult   = await dataRes.json();
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
    const currentCustomCols  = customColumnsRef.current;
    const totalFixedCount    = FIXED_COLS.length;
    const updatedCelldata: any[] = newData[0]?.celldata ?? [];

    const firstBlankCustomColIdx = totalFixedCount + currentCustomCols.length;
    const headerCell    = updatedCelldata.find((c: any) => c.r === 0 && c.c === firstBlankCustomColIdx);
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
    const current = sheetDataRef.current;
    if (!current || !current[0]) return;

    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Filings Matrix");

    const liveGrid = current[0].data;
    if (!liveGrid) return;

    const parseColor = (hexStr: string) => {
      if (!hexStr) return undefined;
      const cleanHex = hexStr.replace("#", "").trim();
      return { argb: cleanHex.length === 6 ? `FF${cleanHex}` : cleanHex };
    };

    for (let r = 0; r < liveGrid.length; r++) {
      const rowCells = liveGrid[r];
      if (!rowCells) continue;

      const excelRow = worksheet.getRow(r + 1);
      if (current[0].config?.rowlen?.[r]) excelRow.height = current[0].config.rowlen[r];

      for (let c = 0; c < rowCells.length; c++) {
        const cell = rowCells[c];
        if (!cell) continue;
        const cellValue = cell.v ?? cell.m ?? "";
        if (cellValue === undefined || cellValue === null) continue;

        const excelCell = excelRow.getCell(c + 1);
        excelCell.value = String(cellValue);

        const font: any = {};
        if (cell.bl) font.bold      = true;
        if (cell.it) font.italic    = true;
        if (cell.ff) font.name      = cell.ff;
        if (cell.fs) font.size      = parseInt(cell.fs, 10);
        if (cell.fc) font.color     = parseColor(cell.fc);
        if (cell.un) font.underline = true;
        if (cell.cl) font.strike    = true;
        if (Object.keys(font).length > 0) excelCell.font = font;

        if (cell.bg) {
          excelCell.fill = { type: "pattern", pattern: "solid", fgColor: parseColor(cell.bg) };
        }

        const alignment: any = {};
        if (cell.ht) alignment.horizontal = cell.ht === "0" ? "center" : cell.ht === "2" ? "right" : "left";
        if (cell.vt) alignment.vertical   = cell.vt === "0" ? "middle" : cell.vt === "2" ? "bottom" : "top";
        if (Object.keys(alignment).length > 0) excelCell.alignment = alignment;
      }
    }

    const maxCols = liveGrid[0]?.length ?? 30;
    for (let c = 0; c < maxCols; c++) {
      const col = worksheet.getColumn(c + 1);
      col.width = current[0].config?.columnlen?.[c]
        ? Math.round(current[0].config.columnlen[c] / 7)
        : 14;
    }

    worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2" }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DTaxRail_FilingsMatrix_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* HEADER */}
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
        💾 Click <strong>Save Layout & Changes</strong> to store cell contents, custom headers, row/column resizes, and formatting permanently.
      </p>

      {/*
        ── SCROLL FIX ──────────────────────────────────────────────────────────
        FortuneSheet's canvas engine captures wheel events via absolute-
        positioned overlay tracks. When the outer page has overflow:auto or
        overflow:scroll, the browser intercepts scroll-up wheel events before
        FortuneSheet can read them, causing the one-direction lock.

        Fix: give FortuneSheet a single, isolated block-level container with:
          • position: relative  → anchors FortuneSheet's absolute overlays
          • overflow: hidden    → stops the PAGE from catching wheel events
            inside this box so FortuneSheet gets them first
          • explicit px height  → no calc(), no flex children, no viewport %
            because FortuneSheet needs stable integer bounds to map its scroll
            coordinate system correctly in both directions
        ─────────────────────────────────────────────────────────────────────── */}
      <div
        ref={sheetContainerRef}
        style={{
          position    : "relative",
          width       : "100%",
          height      : "650px",
          overflow    : "hidden",
          borderRadius: "16px",
          border      : "1px solid #e5e7eb",
          boxShadow   : "0 1px 4px rgba(0,0,0,0.08)",
        }}
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
        Status & Payment updates sync with customers instantly. Right-click a column header → Delete Column to remove custom columns.
      </p>

    </div>
  );
}