import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Plus } from "lucide-react";
// Import the core FortuneSheet Canvas Workbook
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

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

// ─── helper: build a single celldata entry ────────────────────────────────────

function cell(r: number, c: number, v: string, opts: Record<string, any> = {}) {
  return {
    r,
    c,
    v: {
      v,
      m: v,
      ct: { fa: "General", t: "g" },
      ...opts,
    },
  };
}

// ─── main component ──────────────────────────────────────────────────────────

export function FilingsSpreadsheet() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColLabel, setNewColLabel] = useState("");
  const [addingCol, setAddingCol] = useState(false);

  // CONTROLLED WORKBOOK STATE
  const [sheetData, setSheetData] = useState<any[] | null>(null);

  // ── fetch and format data ──────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/filings?_ts=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const fetchedFilings: Filing[] = data.filings ?? [];
        const fetchedCustomCols: CustomColumn[] = data.customColumns ?? [];

        setFilings(fetchedFilings);
        setCustomColumns(fetchedCustomCols);

        const totalCols = FIXED_COLS.length + fetchedCustomCols.length;
        const totalRows = Math.max(fetchedFilings.length + 20, 40);

        // ✅ CORRECT FORMAT: celldata is a flat array of {r, c, v} entries,
        // not a raw 2D matrix. This is what FortuneSheet actually reads —
        // a 2D `data` matrix on initial load is silently ignored, which is
        // why the grid was rendering empty before.
        const celldata: any[] = [];

        // Header row (row 0)
        FIXED_COLS.forEach((col, colIdx) => {
          celldata.push(cell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6" }));
        });
        fetchedCustomCols.forEach((col, colIdx) => {
          const targetCol = FIXED_COLS.length + colIdx;
          celldata.push(cell(0, targetCol, col.label, { bl: 1, bg: "#eff6ff" }));
        });

        // Data rows (row 1 onward)
        fetchedFilings.forEach((filing, rIdx) => {
          const r = rIdx + 1;
          celldata.push(cell(r, 0, filing.member_name ?? ""));
          celldata.push(cell(r, 1, filing.member_pan ?? ""));
          celldata.push(cell(r, 2, filing.member_password ?? ""));
          celldata.push(cell(r, 3, filing.member_phone ?? ""));
          celldata.push(cell(r, 4, filing.member_email ?? ""));
          celldata.push(
            cell(
              r,
              5,
              filing.member_dob
                ? new Date(filing.member_dob).toLocaleDateString("en-IN")
                : ""
            )
          );
          celldata.push(cell(r, 6, filing.status ?? ""));
          celldata.push(cell(r, 7, filing.payment_status ?? ""));

          fetchedCustomCols.forEach((col, cIdx) => {
            const targetCol = FIXED_COLS.length + cIdx;
            const val = filing.custom_fields?.[col.field_key] ?? "";
            celldata.push(cell(r, targetCol, val));
          });
        });

        setSheetData([
          {
            name: "Filings Matrix",
            id: "sheet-1",
            status: 1,
            order: 0,
            celldata,
            row: totalRows,
            column: Math.max(totalCols + 4, 10), // ✅ correct prop name: column, not columnlen
            config: {},
          },
        ]);
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

  // ── update functions wired directly to spreadsheet changes ──────────────────

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

  // ── add custom column ──────────────────────────────────────────────────────

  const addColumn = async () => {
    if (!newColLabel.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ label: newColLabel.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewColLabel("");
        setAddingCol(false);
        fetchData(); // Reload and let the workbook fully remount safely
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── excel export ───────────────────────────────────────────────────────────

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      ...FIXED_COLS.map((c) => c.label),
      ...customColumns.map((c) => c.label),
    ];

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

  // ── handle cell edit events ──────────────────────────────────────────────────
  // FortuneSheet's onChange gives back the FULL updated sheet array (same
  // shape we passed in via `data`), with `data` now populated internally as
  // a 2D matrix snapshot for convenience. We diff against our last known
  // celldata-derived values stored in `filings`/`customColumns` state.

  const handleCellChange = (newData: any[]) => {
    if (!sheetData) return;
    const updatedMatrix = newData[0]?.data; // FortuneSheet outputs `data` (2D) on change, even though input used `celldata`
    if (!updatedMatrix) {
      setSheetData(newData);
      return;
    }

    updatedMatrix.forEach((row: any[], rowIndex: number) => {
      if (rowIndex === 0 || !row) return; // skip header
      const mappingFiling = filings[rowIndex - 1];
      if (!mappingFiling) return;

      row.forEach((cellObj: any, colIndex: number) => {
        const newVal = String(cellObj?.v ?? cellObj?.m ?? "");
        const totalFixedCount = FIXED_COLS.length;

        let oldVal = "";
        if (colIndex < totalFixedCount) {
          const fieldKey = FIXED_COLS[colIndex].key as keyof Filing;
          oldVal = String((mappingFiling as any)[fieldKey] ?? "");
        } else {
          const customIdx = colIndex - totalFixedCount;
          const customKey = customColumns[customIdx]?.field_key;
          oldVal = customKey ? String(mappingFiling.custom_fields?.[customKey] ?? "") : "__skip__";
        }

        if (oldVal === "__skip__" || oldVal === newVal) return;

        if (colIndex < totalFixedCount) {
          const fieldKey = FIXED_COLS[colIndex].key;
          if (fieldKey === "status") {
            updateStatus(mappingFiling.id, newVal);
          } else if (fieldKey === "payment_status") {
            updatePayment(mappingFiling.id, newVal);
          }
          // member_name/pan/password/phone/email/dob are read-only display
          // columns sourced from member creation — intentionally not synced
        } else {
          const customIdx = colIndex - totalFixedCount;
          const customKey = customColumns[customIdx]?.field_key;
          if (customKey) updateCustomField(mappingFiling.id, customKey, newVal);
        }
      });
    });

    setSheetData(newData);
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
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Filings</h1>
          <p className="text-sm text-text-mid mt-0.5">
            {filings.length} filing{filings.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* add column */}
          {addingCol ? (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-blue-400 shadow-sm">
              <input
                autoFocus
                placeholder="Column name"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addColumn();
                  if (e.key === "Escape") setAddingCol(false);
                }}
                className="px-3 py-1 text-sm outline-none w-36"
              />
              <button
                onClick={addColumn}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingCol(false);
                  setNewColLabel("");
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add column
            </button>
          )}

          {/* export excel */}
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE CANVAS SPREADSHEET CONTAINER ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden relative" style={{ height: "550px" }}>
        <Workbook
          key={sheetData[0]?.celldata?.length ?? 0} // remount cleanly after column add/reload
          data={sheetData}
          onChange={handleCellChange}
          config={{
            showinfobar: false,
            sheetFormulaBar: true,
            showsheetbar: false,
            enableAddRow: true,
            enableAddBackTop: false,
          }}
        />
      </div>

      {/* ── FOOTER FOOTNOTE CAPTION LEGEND ── */}
      <p className="text-xs text-gray-400 text-right italic font-medium">
        Status & Payment updates sync with customers. Type custom equations directly inside cell boxes to execute evaluations.
      </p>
    </div>
  );
}