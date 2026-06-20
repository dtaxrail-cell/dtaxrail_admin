import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Plus } from "lucide-react";
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
// Matches the official FortuneSheet format EXACTLY:
// { r, c, v: { v, m, ct: { fa, t } } }

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
  const [newColLabel, setNewColLabel] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [sheetData, setSheetData] = useState<any[] | null>(null);

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

        const totalDataCols = FIXED_COLS.length + fetchedCustomCols.length;

        const celldata: any[] = [];

        // Header row (row 0)
        FIXED_COLS.forEach((col, colIdx) => {
          celldata.push(cell(0, colIdx, col.label, { bl: 1, bg: "#f3f4f6" }));
        });
        fetchedCustomCols.forEach((col, colIdx) => {
          celldata.push(cell(0, FIXED_COLS.length + colIdx, col.label, { bl: 1, bg: "#eff6ff" }));
        });

        // Data rows (row 1+)
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

        // ✅ Debug aid — verify the actual payload shape in the browser console
        console.log("FortuneSheet celldata sample:", celldata.slice(0, 10));
        console.log("FortuneSheet celldata total entries:", celldata.length);

        setSheetData([
          {
            name: "Filings Matrix",
            id: "sheet-1",
            color: "",
            status: 1,
            order: 0,
            hide: 0,
            row: Math.max(fetchedFilings.length + 20, 40),
            column: Math.max(totalDataCols + 4, 18),
            celldata,
            config: {},
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

  const token = async () => (await auth.currentUser?.getIdToken()) ?? "";

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
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleCellChange = (newData: any[]) => {
    if (!sheetData) return;
    const updatedMatrix = newData[0]?.data;
    if (!updatedMatrix) {
      setSheetData(newData);
      return;
    }

    updatedMatrix.forEach((row: any[], rowIndex: number) => {
      if (rowIndex === 0 || !row) return;
      const mappingFiling = filings[rowIndex - 1];
      if (!mappingFiling) return;

      row.forEach((cellObj: any, colIndex: number) => {
        const newVal = String(cellObj?.v ?? cellObj?.m ?? "");
        const totalFixedCount = FIXED_COLS.length;

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

    setSheetData(newData);
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
              <button onClick={addColumn} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Add
              </button>
              <button
                onClick={() => { setAddingCol(false); setNewColLabel(""); }}
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

          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden relative" style={{ height: "550px" }}>
        <Workbook
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

      <p className="text-xs text-gray-400 text-right italic font-medium">
        Status & Payment updates sync with customers. Type custom equations directly inside cell boxes to execute evaluations.
      </p>
    </div>
  );
}