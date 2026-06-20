import { useEffect, useMemo, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Download, Plus, Search } from "lucide-react";
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

// ─── main component ──────────────────────────────────────────────────────────

export function FilingsSpreadsheet() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [addingCol, setAddingCol] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE_URL}/filings`, {
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
      setFilings((prev) => prev.map((f) => (f.id === filingId ? { ...f, status } : f)));
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
      setFilings((prev) => prev.map((f) => (f.id === filingId ? { ...f, payment_status } : f)));
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
      const res = await fetch(`${API_BASE_URL}/filings/custom-columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ label: newColLabel.trim() }),
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

  // ── excel export ───────────────────────────────────────────────────────────

  const exportExcel = async () => {
    const XLSX = await import("xlsx");

    const headers = [
      ...FIXED_COLS.map((c) => c.label),
      ...customColumns.map((c) => c.label),
    ];

    const rows = filteredFilings.map((f) => [
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

  // ── filter ─────────────────────────────────────────────────────────────────

  const filteredFilings = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return filings;
    return filings.filter((f) =>
      [f.member_name, f.member_pan, f.member_phone, f.member_email, f.status, f.payment_status].some((v) =>
        (v ?? "").toLowerCase().includes(s)
      )
    );
  }, [filings, searchTerm]);

  // ── transform data to fortunesheet cellular matrix format ──────────────────

  const cellMatrixData = useMemo(() => {
    const headerRow: any[] = [];

    // Create styled header cells for fixed columns
    FIXED_COLS.forEach((col) => {
      headerRow.push({ v: col.label, bl: 1, bg: "#f3f4f6", ht: 1, vt: 1 });
    });

    // Create styled header cells for dynamic custom columns
    customColumns.forEach((col) => {
      headerRow.push({ v: col.label, bl: 1, bg: "#eff6ff", ht: 1, vt: 1 });
    });

    const matrix: any[][] = [headerRow];

    // Build row blocks for every single filing record matching search metric filters
    filteredFilings.forEach((filing) => {
      const rowCells: any[] = [
        { v: filing.member_name ?? "" },
        { v: filing.member_pan ?? "" },
        { v: filing.member_password ?? "" },
        { v: filing.member_phone ?? "" },
        { v: filing.member_email ?? "" },
        { v: filing.member_dob ? new Date(filing.member_dob).toLocaleDateString("en-IN") : "" },
        { v: filing.status ?? "" },
        { v: filing.payment_status ?? "" },
      ];

      // Add values for custom dynamic field columns
      customColumns.forEach((col) => {
        const cellValue = filing.custom_fields?.[col.field_key] ?? "";
        rowCells.push({ v: cellValue });
      });

      matrix.push(rowCells);
    });

    return matrix;
  }, [filteredFilings, customColumns]);

  // FortuneSheet component data payload structural bundle config object array
  const sheetsConfig = useMemo(() => {
    return [
      {
        name: "Filings Matrix",
        id: "sheet-1",
        status: 1,
        data: cellMatrixData,
        columnlen: FIXED_COLS.length + customColumns.length + 2,
        rowlen: Math.max(cellMatrixData.length + 10, 25),
      },
    ];
  }, [cellMatrixData, customColumns.length]);

  // Handle cell edit events directly inside the FortuneSheet component grid
  const handleCellChange = (newData: any[]) => {
    const updatedGridMatrix = newData[0]?.data;
    if (!updatedGridMatrix) return;

    // Loop through cells to look for any modifications compared to current state cache
    updatedGridMatrix.forEach((row: any[], rowIndex: number) => {
      if (rowIndex === 0) return; // Ignore edits made to header cells labels row

      const mappingFiling = filteredFilings[rowIndex - 1];
      if (!mappingFiling) return;

      row.forEach((cell: any, colIndex: number) => {
        const oldVal = String(cellMatrixData[rowIndex]?.[colIndex]?.v ?? "");
        const newVal = String(cell?.v ?? "");

        // If a cell's string content was altered by user, fire matching update endpoint
        if (oldVal !== newVal) {
          const totalFixedCount = FIXED_COLS.length;

          if (colIndex < totalFixedCount) {
            const fieldKey = FIXED_COLS[colIndex].key;
            if (fieldKey === "status") {
              updateStatus(mappingFiling.id, newVal);
            } else if (fieldKey === "payment_status") {
              updatePayment(mappingFiling.id, newVal);
            }
          } else {
            // Find custom column key corresponding to this index
            const targetCustomIndex = colIndex - totalFixedCount;
            const customColKey = customColumns[targetCustomIndex]?.field_key;
            if (customColKey) {
              updateCustomField(mappingFiling.id, customColKey, newVal);
            }
          }
        }
      });
    });
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-mid font-medium">
        Loading spreadsheet canvas grid...
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
            {filteredFilings.length} filing{filteredFilings.length !== 1 ? "s" : ""}{" "}
            {searchTerm ? "matched" : "total"}
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
              className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-gray-200 outline-none focus:border-blue-400 w-56 shadow-sm"
            />
          </div>

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
        {filings.length > 0 ? (
          <Workbook
            data={sheetsConfig}
            onChange={handleCellChange}
            config={{
              showinfobar: false, // Hides branding bar header
              sheetFormulaBar: true, // Enables full formula calculation bar (=SUM, etc)
              showsheetbar: false, // Disables tab navigation bar since we only need 1 master sheet
              enableAddRow: true,
              enableAddBackTop: false,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
            No filings found matching your profile data layers.
          </div>
        )}
      </div>

      {/* ── FOOTER FOOTNOTE CAPTION LEGEND ── */}
      <p className="text-xs text-gray-400 text-right italic font-medium">
        Status & Payment updates sync with customers. Type custom equations directly inside cell boxes to execute evaluations.
      </p>
    </div>
  );
}