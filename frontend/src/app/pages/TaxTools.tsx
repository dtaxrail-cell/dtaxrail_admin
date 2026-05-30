import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Save, Plus, Trash2, ChevronDown, Copy, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { API_BASE_URL } from "../../config/api";
import { auth } from "../../lib/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Slab { from: number; to: number | null; rate: number; }

interface RegimeConfig {
  standardDeduction: number;
  exemptionLimit?: number;
  rebateLimit: number;
  slabs: Slab[];
}

interface SliderLimits {
  incomeMax: number;
  allowancesMax: number;
  deductionsMax: number;
  npsMax: number;
  tdsMax: number;
}

interface PersonaMessages {
  salaried: string;
  freelancer: string;
  business: string;
}

interface YearMetadata {
  financialYear: string;
  newRegime: RegimeConfig;
  oldRegime: { general: RegimeConfig; senior: RegimeConfig; super_senior: RegimeConfig; };
  sliderLimits: SliderLimits;
  personaMessages: PersonaMessages;
}

type OldRegimeAge = "general" | "senior" | "super_senior";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const inr = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteYearModal({
  year,
  onConfirm,
  onCancel,
  deleting,
}: {
  year: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-dark">Delete Financial Year</h2>
            <p className="text-xs text-text-mid mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-text-mid">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-text-dark">{year}</span>? All tax slabs,
          limits, and persona messages for this year will be removed.
        </p>

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-red-500 hover:bg-red-600 text-white gap-2"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {deleting ? "Deleting…" : "Delete year"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function SlabTable({ slabs, onChange }: { slabs: Slab[]; onChange: (s: Slab[]) => void }) {
  const set = (i: number, field: keyof Slab, raw: string) => {
    const next = slabs.map((s, idx) =>
      idx !== i ? s : {
        ...s,
        [field]: field === "to"
          ? (raw === "" || raw.toLowerCase() === "null" ? null : Number(raw))
          : Number(raw),
      }
    );
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 px-1">
        <span className="text-xs text-text-mid font-medium">From (₹)</span>
        <span className="text-xs text-text-mid font-medium">To (₹) — blank = no cap</span>
        <span className="text-xs text-text-mid font-medium">Rate %</span>
        <span />
      </div>

      {slabs.map((slab, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
          <Input value={slab.from} onChange={e => set(i, "from", e.target.value)} className="h-8 text-sm" />
          <Input value={slab.to ?? ""} onChange={e => set(i, "to", e.target.value)} placeholder="no cap" className="h-8 text-sm" />
          <Input value={slab.rate} onChange={e => set(i, "rate", e.target.value)} className="h-8 text-sm" />
          <button onClick={() => onChange(slabs.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-600 flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Preview */}
      {slabs.length > 0 && (
        <div className="mt-2 p-2.5 rounded-lg bg-surface text-xs text-text-mid space-y-0.5">
          <p className="font-medium text-text-dark mb-1">Preview</p>
          {slabs.map((s, i) => (
            <p key={i}>
              {inr(s.from)} – {s.to ? inr(s.to) : "above"} &rarr; <strong>{s.rate}%</strong>
            </p>
          ))}
        </div>
      )}

      <button onClick={() => onChange([...slabs, { from: 0, to: null, rate: 0 }])}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium mt-1">
        <Plus className="w-3 h-3" /> Add slab
      </button>
    </div>
  );
}

function RegimePanel({
  label,
  config,
  showExemption = false,
  onChange,
}: {
  label: string;
  config: RegimeConfig;
  showExemption?: boolean;
  onChange: (c: RegimeConfig) => void;
}) {
  return (
    <div className="space-y-5">
      <div className={`grid gap-4 ${showExemption ? "grid-cols-3" : "grid-cols-2"}`}>
        <div>
          <label className="text-xs text-text-mid block mb-1.5">Standard Deduction (₹)</label>
          <Input value={config.standardDeduction}
            onChange={e => onChange({ ...config, standardDeduction: Number(e.target.value) })} />
          <p className="text-xs text-text-light mt-1">{inr(config.standardDeduction)}</p>
        </div>
        {showExemption && (
          <div>
            <label className="text-xs text-text-mid block mb-1.5">Basic Exemption Limit (₹)</label>
            <Input value={config.exemptionLimit ?? 0}
              onChange={e => onChange({ ...config, exemptionLimit: Number(e.target.value) })} />
            <p className="text-xs text-text-light mt-1">{inr(config.exemptionLimit ?? 0)}</p>
          </div>
        )}
        <div>
          <label className="text-xs text-text-mid block mb-1.5">Rebate / 87A Limit (₹)</label>
          <Input value={config.rebateLimit}
            onChange={e => onChange({ ...config, rebateLimit: Number(e.target.value) })} />
          <p className="text-xs text-text-light mt-1">{inr(config.rebateLimit)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-text-dark mb-2">Tax Slabs</p>
        <SlabTable slabs={config.slabs} onChange={s => onChange({ ...config, slabs: s })} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function TaxTools() {
  const [years, setYears] = useState<{ financial_year: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [metadata, setMetadata] = useState<YearMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oldTab, setOldTab] = useState<OldRegimeAge>("general");
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYearVal, setNewYearVal] = useState("");
  const [cloneFrom, setCloneFrom] = useState("");
  const [creating, setCreating] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadYears = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/tax-tools/years`);
      const list: { financial_year: string }[] = data.years ?? [];
      setYears(list);
      if (list.length && !selectedYear) setSelectedYear(list[0].financial_year);
    } catch { /* ignore */ }
  }, [selectedYear]);

  const loadConfig = useCallback(async (year: string) => {
    if (!year) return;
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const { data } = await axios.get(
        `${API_BASE_URL}/tax-tools/admin/${encodeURIComponent(year)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMetadata(data.row.metadata as YearMetadata);
    } catch { alert("Failed to load config for " + year); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadYears(); }, []);
  useEffect(() => { if (selectedYear) loadConfig(selectedYear); }, [selectedYear]);

  const save = async () => {
    if (!metadata) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.put(
        `${API_BASE_URL}/tax-tools/admin/${encodeURIComponent(selectedYear)}`,
        { metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveMsg({ ok: true, text: "Saved successfully!" });
    } catch {
      setSaveMsg({ ok: false, text: "Save failed. Please try again." });
    } finally { setSaving(false); }
  };

  const createYear = async () => {
    if (!newYearVal.trim()) return;
    setCreating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.post(
        `${API_BASE_URL}/tax-tools/admin/years`,
        { financialYear: newYearVal.trim(), cloneFrom: cloneFrom || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowNewYear(false);
      setNewYearVal(""); setCloneFrom("");
      await loadYears();
      setSelectedYear(newYearVal.trim());
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to create year");
    } finally { setCreating(false); }
  };

  const deleteYear = async () => {
    if (!selectedYear) return;
    setDeleting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.delete(
        `${API_BASE_URL}/tax-tools/admin/${encodeURIComponent(selectedYear)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDeleteModal(false);
      setMetadata(null);
      // Reload years and auto-select first available
      const { data } = await axios.get(`${API_BASE_URL}/tax-tools/years`);
      const list: { financial_year: string }[] = data.years ?? [];
      setYears(list);
      setSelectedYear(list.length ? list[0].financial_year : "");
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to delete year");
    } finally { setDeleting(false); }
  };

  // Updaters
  const setNew = (c: RegimeConfig) => setMetadata(m => m ? { ...m, newRegime: c } : m);
  const setOld = (age: OldRegimeAge, c: RegimeConfig) =>
    setMetadata(m => m ? { ...m, oldRegime: { ...m.oldRegime, [age]: c } } : m);
  const setSlider = (k: keyof SliderLimits, v: number) =>
    setMetadata(m => m ? { ...m, sliderLimits: { ...m.sliderLimits, [k]: v } } : m);
  const setPersona = (k: keyof PersonaMessages, v: string) =>
    setMetadata(m => m ? { ...m, personaMessages: { ...m.personaMessages, [k]: v } } : m);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteYearModal
          year={selectedYear}
          onConfirm={deleteYear}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Tax Calculator CMS</h1>
          <p className="text-text-mid mt-1 text-sm">Manage slabs, limits, and CTA messages per financial year</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {saveMsg.text}
            </span>
          )}
          <Button onClick={save} disabled={saving || loading || !metadata}
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Year picker ── */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-semibold text-text-dark whitespace-nowrap">Financial Year</label>
            <div className="relative">
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="appearance-none border rounded-xl px-4 py-2 pr-9 text-sm font-medium bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                {years.map(y => <option key={y.financial_year} value={y.financial_year}>{y.financial_year}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-text-mid" />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs"
              onClick={() => setShowNewYear(v => !v)}>
              <Plus className="w-3.5 h-3.5" /> New year
            </Button>

            {/* ── Delete year button ── */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400"
              disabled={!selectedYear || years.length <= 1}
              onClick={() => setShowDeleteModal(true)}
              title={years.length <= 1 ? "Cannot delete the only financial year" : `Delete ${selectedYear}`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete year
            </Button>
          </div>

          {/* Hint when only one year exists */}
          {years.length <= 1 && selectedYear && (
            <p className="mt-2 text-xs text-text-light">
              You need at least one financial year — add another before deleting this one.
            </p>
          )}

          {showNewYear && (
            <div className="mt-5 p-4 rounded-xl border bg-surface space-y-4">
              <p className="text-sm font-semibold text-text-dark">Add financial year</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-mid block mb-1.5">New year (e.g. 2027-28)</label>
                  <Input value={newYearVal} onChange={e => setNewYearVal(e.target.value)} placeholder="2027-28" />
                </div>
                <div>
                  <label className="text-xs text-text-mid block mb-1.5">Clone from (optional)</label>
                  <div className="relative">
                    <select value={cloneFrom} onChange={e => setCloneFrom(e.target.value)}
                      className="w-full appearance-none border rounded-lg px-3 py-2 pr-8 text-sm bg-background focus:outline-none">
                      <option value="">— start blank —</option>
                      {years.map(y => <option key={y.financial_year} value={y.financial_year}>{y.financial_year}</option>)}
                    </select>
                    <Copy className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-text-mid" />
                  </div>
                </div>
              </div>
              <Button size="sm" disabled={creating || !newYearVal.trim()} onClick={createYear} className="rounded-lg">
                {creating ? "Creating…" : "Create year"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && <p className="text-center text-text-mid text-sm py-12">Loading config…</p>}

      {!loading && metadata && (
        <>
          {/* ── New Regime ── */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <CardTitle className="text-base">New Regime</CardTitle>
                <span className="text-xs text-text-mid">— applies to all age categories</span>
              </div>
            </CardHeader>
            <CardContent>
              <RegimePanel label="New regime" config={metadata.newRegime} onChange={setNew} />
            </CardContent>
          </Card>

          {/* ── Old Regime ── */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <CardTitle className="text-base">Old Regime</CardTitle>
                <span className="text-xs text-text-mid">— different slabs per age</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Age tabs */}
              <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border">
                {([
                  ["general", "General (< 60)"],
                  ["senior", "Senior (60–79)"],
                  ["super_senior", "Super Senior (80+)"],
                ] as [OldRegimeAge, string][]).map(([key, lbl]) => (
                  <button key={key} onClick={() => setOldTab(key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      oldTab === key
                        ? "bg-white shadow text-text-dark"
                        : "text-text-mid hover:text-text-dark"
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>

              <RegimePanel
                label={oldTab === "general" ? "General Citizen" : oldTab === "senior" ? "Senior Citizen (60–79)" : "Super Senior Citizen (80+)"}
                config={metadata.oldRegime[oldTab]}
                showExemption
                onChange={c => setOld(oldTab, c)}
              />
            </CardContent>
          </Card>

          {/* ── Slider Limits ── */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Slider Limits</CardTitle>
              <p className="text-xs text-text-mid mt-0.5">Maximum values customers can enter in the app</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {([
                  ["incomeMax",      "Gross Income max"],
                  ["allowancesMax",  "Exempted Allowances max"],
                  ["deductionsMax",  "Deductions max"],
                  ["npsMax",         "NPS Contribution max"],
                  ["tdsMax",         "TDS / Tax Paid max"],
                ] as [keyof SliderLimits, string][]).map(([key, lbl]) => (
                  <div key={key}>
                    <label className="text-xs text-text-mid block mb-1.5">{lbl} (₹)</label>
                    <Input value={metadata.sliderLimits[key]}
                      onChange={e => setSlider(key, Number(e.target.value))} />
                    <p className="text-xs text-green-600 font-medium mt-1">{inr(metadata.sliderLimits[key])}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Persona CTA Messages ── */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Persona CTA Messages</CardTitle>
              <p className="text-xs text-text-mid mt-0.5">
                Only the message matching the customer's selected persona appears in the app
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {([
                ["salaried",   "Salaried",                       "Finalize your tax and File your ITR now"],
                ["freelancer", "Freelancer",                     "Since you're a freelancer…"],
                ["business",   "Merchant / Sole Proprietor / Business", "Since you fall under sole proprietor…"],
              ] as [keyof PersonaMessages, string, string][]).map(([key, lbl, ph]) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      key === "salaried" ? "bg-green-400" :
                      key === "freelancer" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <label className="text-sm font-semibold text-text-dark">{lbl}</label>
                  </div>
                  <Textarea value={metadata.personaMessages[key]}
                    onChange={e => setPersona(key, e.target.value)}
                    rows={2} placeholder={ph} className="resize-none text-sm" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bottom save */}
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}
              className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save All Changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}