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

// ✅ Point 1: columns now grow dynamically — base buffer of 10 spare columns
// beyond real data, and if the admin adds enough custom columns to use them
// all up, the sheet rebuilds with more buffer automatically (see buildSheet).
const COLUMN_BUFFER = 10;

function cell(r: number, c: number, value: string, extra: Record<string, any> = {}) {
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
  const [filings, setFilings] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetData, setSheetData] = useState<any[] | null>(null);

  // Holds the last-saved layout (row heights, col widths, extra blank rows)
  // fetched once on load, merged into the rebuilt sheet on every refresh.
  const savedLayoutRef = useRef<Record<string, any>>({});

  // ── build the FortuneSheet sheet object ─────────────────────────────────────

  const buildSheet = (
    fetchedFilings: Filing[],
    fetchedCustomCols: CustomColumn[],
    layout: Record<string, any>
  ) => {
    const totalDataCols = FIXED_COLS.length + fetchedCustomCols.length;
    const celldata: any[] = [];

    FIXED_COLS.forEach((col, colIdx) => {
      celldata.push(cell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6" }));
    });
    fetchedCustomCols.forEach((col, colIdx) => {
      celldata.push(cell(0, FIXED_COLS.length + colIdx, col.label, { bl: 1, bg: "#eff6ff" }));
    });

    fetchedFilings.forEach((filing, rIdx) => {
      const r = rIdx + 1;
      celldata.push(cell(r, 0, filing.member_name ?? ""));
      celldata.push(cell(r, 1, filing.member_pan ?? ""));
      celldata.push(cell(r, 2, filing.member_password ?? ""));
      celldata.push(cell(r, 3, filing.member_phone ?? ""));
      celldata.push(cell(r, 4, filing.member_email ?? ""));
      celldata.push(
        cell(r, 5, filing.member_dob ? new Date(filing.member_dob).toLocaleDateString("en-IN") : "")
      );
      celldata.push(cell(r, 6, filing.status ?? ""));
      celldata.push(cell(r, 7, filing.payment_status ?? ""));

      fetchedCustomCols.forEach((col, cIdx) => {
        const val = filing.custom_fields?.[col.field_key] ?? "";
        celldata.push(cell(r, FIXED_COLS.length + cIdx, val));
      });
    });

    // ✅ Point 4: re-apply any extra blank rows / manual cell edits the admin
    // made beyond the real data rows (stored in layout.extraCelldata), so
    // typed notes in blank rows below the data survive a refresh.
    const dataRowCount = fetchedFilings.length + 1; // +1 for header
    const extraCelldata: any[] = Array.isArray(layout.extraCelldata)
      ? layout.extraCelldata.filter((c: any) => c.r >= dataRowCount)
      : [];

    const allCelldata = [...celldata, ...extraCelldata];

    // ✅ Point 1: figure out how many rows/columns the saved layout actually
    // used, so re-applying row heights/col widths and extra rows doesn't get
    // truncated, and so newly added columns beyond BH keep working.
    const layoutMaxRow = Array.isArray(layout.extraCelldata)
      ? layout.extraCelldata.reduce((m: number, c: any) => Math.max(m, c.r), 0)
      : 0;
    const layoutMaxCol = layout.config?.columnlen
      ? Math.max(...Object.keys(layout.config.columnlen).map(Number), 0)
      : 0;

    const totalRows = Math.max(fetchedFilings.length + 20, 40, layoutMaxRow + 10);
    const totalCols = Math.max(totalDataCols + COLUMN_BUFFER, layoutMaxCol + 10, 30);

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
        // ✅ Point 4: row heights / column widths from saved layout, merged in.
        config: {
          rowlen: layout.config?.rowlen ?? {},
          columnlen: layout.config?.columnlen ?? {},
          merge: layout.config?.merge ?? {},
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

  // ── fetch filings + custom columns + saved layout ───────────────────────────

  const fetchData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      const [filingsRes, layoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/filings?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/filings/sheet-layout?_ts=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const data = await filingsRes.json();
      const layoutData = await layoutRes.json();

      if (data.success) {
        const fetchedFilings: Filing[] = data.filings ?? [];
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

  useEffect(() => {
    fetchData();
  }, []);

  // ── token helper ───────────────────────────────────────────────────────────

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

  // ── cell value updates (status / payment / custom fields) ──────────────────

  const updateStatus = async (filingId: string, status: string) => {
    try {
      await fetch(`${API_BASE_URL}/filings/status/${filingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updatePayment = async (filingId: string, payment_status: string) => {
    try {
      await fetch(`${API_BASE_URL}/filings/payment/${filingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ payment_status }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateCustomField = async (filingId: string, field_key: string, value: string) => {
    try {
      await fetch(`${API_BASE_URL}/filings/custom-field/${filingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ field_key, value }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── custom column add/delete ────────────────────────────────────────────────
  // ✅ Point 3: "Add column" button removed from the header bar entirely.
  // ✅ Point 1 + 5: adding/deleting a column now happens by typing directly
  // into a blank header cell beyond the current data (row 0), or by
  // right-clicking an existing custom column header and choosing Delete.
  // Both paths sync to the backend so they survive a refresh.

  const addColumnBackend = async (label: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      return data?.success ? data.column : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const deleteColumnBackend = async (field_key: string) => {
    try {
      await fetch(`${API_BASE_URL}/filings/custom-columns/${field_key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await token()}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── save sheet layout (row heights, col widths, extra blank-row content) ──
  // ✅ Point 4: debounced save whenever structural/layout state changes.

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistLayout = useCallback((newData: any[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const sheet = newData[0];
        if (!sheet) return;

        const dataRowCount = filings.length + 1;
        const matrix = sheet.data;
        const extraCelldata: any[] = [];

        if (Array.isArray(matrix)) {
          matrix.forEach((row: any[], r: number) => {
            if (r < dataRowCount || !row) return;
            row.forEach((cellObj: any, c: number) => {
              const v = cellObj?.v ?? cellObj?.m;
              if (v !== null && v !== undefined && v !== "") {
                extraCelldata.push({ r, c, v: String(v) });
              }
            });
          });
        }

        const layout = {
          config: {
            rowlen: sheet.config?.rowlen ?? {},
            columnlen: sheet.config?.columnlen ?? {},
            merge: sheet.config?.merge ?? {},
          },
          extraCelldata,
        };

        savedLayoutRef.current = layout;

        await fetch(`${API_BASE_URL}/filings/sheet-layout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
          body: JSON.stringify({ layout }),
        });
      } catch (e) {
        console.error(e);
      }
    }, 600);
  }, [filings]);

  // ── excel export ───────────────────────────────────────────────────────────
  // ✅ Point 2: exported sheet auto-fits column widths to content + freezes
  // header row, same logic as before but explicitly confirmed/kept.

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [...FIXED_COLS.map((c) => c.label), ...customColumns.map((c) => c.label)];

    const rows = filings.map((f) => [
      f.member_name ?? "",
      f.member_pan ?? "",
      f.member_password ?? "",
      f.member_phone ?? "",
      f.member_email ?? "",
      f.member_dob ? new Date(f.member_dob).toLocaleDateString("en-IN") : "",
      f.status ?? "",
      f.payment_status ?? "",
      ...customColumns.map((c) => f.custom_fields?.[c.field_key] ?? ""),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h, colIdx) => ({
      wch: Math.min(Math.max(h.length, ...rows.map((r) => String(r[colIdx] ?? "").length)) + 2, 40),
    }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filings");
    XLSX.writeFile(wb, `DTaxRail_Filings_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── handle cell value changes ────────────────────────────────────────────────

  const handleCellChange = (newData: any[]) => {
    if (!sheetData) return;
    const updatedMatrix = newData[0]?.data;

    if (updatedMatrix) {
      const totalFixedCount = FIXED_COLS.length;
      const headerRow = updatedMatrix[0];

      // ✅ Point 1 + 5: detect a NEW label typed into a previously-blank
      // header cell beyond current custom columns — auto-create that column
      // on the backend (same flow as the old "Add column" button, just
      // triggered inline by typing the header directly).
      if (headerRow) {
        const firstBlankCustomCol = totalFixedCount + customColumns.length;
        const maybeNewHeaderCell = headerRow[firstBlankCustomCol];
        const maybeNewLabel = String(maybeNewHeaderCell?.v ?? maybeNewHeaderCell?.m ?? "").trim();

        if (maybeNewLabel) {
          addColumnBackend(maybeNewLabel).then((col) => {
            if (col) fetchData(); // resync so the new column's field_key/order is correct
          });
        }
      }

      // ── existing fixed/custom cell value diffing ──
      updatedMatrix.forEach((row: any[], rowIndex: number) => {
        if (rowIndex === 0 || !row) return;
        const mappingFiling = filings[rowIndex - 1];
        if (!mappingFiling) return;

        row.forEach((cellObj: any, colIndex: number) => {
          const newVal = String(cellObj?.v ?? cellObj?.m ?? "");

          if (colIndex < totalFixedCount) {
            const fieldKey = FIXED_COLS[colIndex].key;
            const oldVal = String((mappingFiling as any)[fieldKey] ?? "");
            if (oldVal === newVal) return;
            if (fieldKey === "status") updateStatus(mappingFiling.id, newVal);
            else if (fieldKey === "payment_status") updatePayment(mappingFiling.id, newVal);
          } else {
            const customIdx = colIndex - totalFixedCount;
            const customKey = customColumns[customIdx]?.field_key;
            if (!customKey) return;
            const oldVal = String(mappingFiling.custom_fields?.[customKey] ?? "");
            if (oldVal === newVal) return;
            updateCustomField(mappingFiling.id, customKey, newVal);
          }
        });
      });
    }

    setSheetData(newData);
    persistLayout(newData); // ✅ Point 4: save row/col layout + extra-row content on every change
  };

  // ── structural ops (column delete via right-click, row/col resize) ─────────

  const handleOp = useCallback(
    (ops: any[]) => {
      ops.forEach((op) => {
        if (op?.op === "deleteRowCol") {
          const value = op.value;
          if (!value || value.type !== "column") return;

          const startCol = value.index;
          const count = value.count ?? 1;

          for (let c = startCol; c < startCol + count; c++) {
            const customIdx = c - FIXED_COLS.length;
            if (customIdx < 0) continue; // fixed columns aren't deletable
            const colToDelete = customColumns[customIdx];
            if (colToDelete) deleteColumnBackend(colToDelete.field_key);
          }

          // ✅ Point 5: resync from backend so deletion actually sticks
          setTimeout(() => fetchData(), 300);
        }
      });

      // Any structural op (resize, merge, etc.) also triggers a layout save,
      // debounced via persistLayout — handled through onChange already since
      // FortuneSheet fires onChange alongside onOp for most structural edits.
    },
    [customColumns]
  );

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

        {/* ✅ Point 3: "Add column" button removed — only Export Excel remains */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ✅ Point 2: full-width, full-viewport-aware container so the sheet
         genuinely fills the page rather than a fixed small box */}
      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden relative"
        style={{ height: "calc(100vh - 220px)", minHeight: "500px", width: "100%" }}
      >
        <Workbook
          data={sheetData}
          onChange={handleCellChange}
          onOp={handleOp}
          config={{
            showinfobar: false,
            sheetFormulaBar: true,
            showsheetbar: false,
            enableAddRow: true,
            enableAddBackTop: false,
          }}
        />
      </div>

      {/* ✅ Point 6: list of workspace links restored below the sheet, since
         FortuneSheet cells can't host React <Link> buttons inline */}
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

      <p className="text-xs text-gray-400 text-right italic font-medium">
        Status & Payment updates sync with customers. Type a new column name in a
        blank header cell to add it. Right-click a custom column header to delete it.
      </p>
    </div>
  );
}