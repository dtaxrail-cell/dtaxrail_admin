import { getPool } from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function applySlabs(taxableIncome, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    const from = Number(slab.from) || 0;
    const to = slab.to != null ? Number(slab.to) : null;
    const rate = Number(slab.rate) || 0;

    if (taxableIncome <= from) break;

    const upper = to ?? taxableIncome;
    const chunk = Math.min(taxableIncome, upper) - from;
    if (chunk > 0) tax += chunk * (rate / 100);
  }
  return tax;
}

function calcTax(taxableIncome, slabs, rebateLimit) {
  if (taxableIncome <= 0) return 0;
  let tax = applySlabs(taxableIncome, slabs);
  // Section 87A rebate: if net taxable income <= rebateLimit, tax = 0
  if (taxableIncome <= rebateLimit) tax = 0;
  // Add 4% health & education cess
  return Math.round(tax * 1.04);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL YEARS  (public)
// GET /tax-tools/years
// ─────────────────────────────────────────────────────────────────────────────
export const getAllYears = async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT id, metadata->>'financialYear' AS financial_year, is_active, updated_at
       FROM tax_tools
       WHERE category = 'tax_calculator'
       ORDER BY metadata->>'financialYear' DESC`
    );
    res.json({ success: true, years: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CONFIG FOR A YEAR  (public)
// GET /tax-tools/config/:year   e.g. /tax-tools/config/2026-27
// ─────────────────────────────────────────────────────────────────────────────
export const getYearConfig = async (req, res) => {
  try {
    const { year } = req.params;
    const result = await getPool().query(
      `SELECT * FROM tax_tools
       WHERE category = 'tax_calculator'
         AND metadata->>'financialYear' = $1
         AND is_active = true
       LIMIT 1`,
      [year]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: "Year not found" });
    }
    res.json({ success: true, config: result.rows[0].metadata });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATE TAX  (public)
// POST /tax-tools/calculate
// ─────────────────────────────────────────────────────────────────────────────
export const calculateTax = async (req, res) => {
  try {
    const {
      financialYear,
      filingPersona,
      ageCategory = "general",
      grossIncome = 0,
      exemptedAllowances = 0,
      deductions = 0,
      npsContribution = 0,
      tdsPaid = 0,
    } = req.body;

    const result = await getPool().query(
      `SELECT metadata FROM tax_tools
       WHERE category = 'tax_calculator'
         AND metadata->>'financialYear' = $1
         AND is_active = true
       LIMIT 1`,
      [financialYear]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: "Config for this financial year not found" });
    }

    const cfg = result.rows[0].metadata;
    const newCfg = cfg.newRegime;
    const oldCfgByAge = cfg.oldRegime[ageCategory];

    if (!newCfg || !oldCfgByAge) {
      return res.status(400).json({ success: false, error: "Invalid config or age category" });
    }

    const newNetIncome = Math.max(0, grossIncome - exemptedAllowances - newCfg.standardDeduction);
    const newTaxLiability = calcTax(newNetIncome, newCfg.slabs, newCfg.rebateLimit);

    const oldNetIncome = Math.max(
      0,
      grossIncome - exemptedAllowances - oldCfgByAge.standardDeduction - deductions - npsContribution
    );
    const oldTaxLiability = calcTax(oldNetIncome, oldCfgByAge.slabs, oldCfgByAge.rebateLimit);

    const savings =
      newTaxLiability < oldTaxLiability
        ? { amount: oldTaxLiability - newTaxLiability, regime: "new" }
        : oldTaxLiability < newTaxLiability
        ? { amount: newTaxLiability - oldTaxLiability, regime: "old" }
        : { amount: 0, regime: "equal" };

    const bestTax = Math.min(newTaxLiability, oldTaxLiability);
    const netTaxPosition = bestTax - Number(tdsPaid);
    const refund =
      netTaxPosition < 0
        ? { type: "refund", amount: Math.abs(netTaxPosition) }
        : netTaxPosition > 0
        ? { type: "payable", amount: netTaxPosition }
        : { type: "nil", amount: 0 };

    const personaMap = {
      salaried: cfg.personaMessages?.salaried,
      freelancer: cfg.personaMessages?.freelancer,
      business: cfg.personaMessages?.business,
    };
    const cta = personaMap[filingPersona] ?? personaMap.salaried;

    res.json({
      success: true,
      result: {
        newRegime: { netIncome: newNetIncome, taxLiability: newTaxLiability },
        oldRegime: { netIncome: oldNetIncome, taxLiability: oldTaxLiability, ageCategory },
        savings,
        refund,
        cta,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET FULL CONFIG FOR A YEAR
// GET /tax-tools/admin/:year
// ─────────────────────────────────────────────────────────────────────────────
export const adminGetYearConfig = async (req, res) => {
  try {
    const { year } = req.params;
    const result = await getPool().query(
      `SELECT * FROM tax_tools
       WHERE category = 'tax_calculator'
         AND metadata->>'financialYear' = $1
       LIMIT 1`,
      [year]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: "Year not found" });
    }
    res.json({ success: true, row: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CREATE A NEW YEAR
// POST /tax-tools/admin/years
// Body: { financialYear: "2027-28", cloneFrom?: "2026-27" }
// ─────────────────────────────────────────────────────────────────────────────
export const adminCreateYear = async (req, res) => {
  try {
    const { financialYear, cloneFrom } = req.body;

    if (!financialYear) {
      return res.status(400).json({ success: false, error: "financialYear is required" });
    }

    const existing = await getPool().query(
      `SELECT id FROM tax_tools WHERE category = 'tax_calculator' AND metadata->>'financialYear' = $1`,
      [financialYear]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: "Financial year already exists" });
    }

    let metadata;
    if (cloneFrom) {
      const source = await getPool().query(
        `SELECT metadata FROM tax_tools WHERE category = 'tax_calculator' AND metadata->>'financialYear' = $1`,
        [cloneFrom]
      );
      if (!source.rows[0]) {
        return res.status(404).json({ success: false, error: "Source year not found" });
      }
      metadata = { ...source.rows[0].metadata, financialYear };
    } else {
      metadata = defaultMetadataScaffold(financialYear);
    }

    const result = await getPool().query(
      `INSERT INTO tax_tools (category, title, content, metadata)
       VALUES ('tax_calculator', $1, 'Tax Calculator Configuration', $2)
       RETURNING *`,
      [`Tax Calculator ${financialYear}`, metadata]
    );

    res.json({ success: true, row: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: SAVE FULL CONFIG FOR A YEAR
// PUT /tax-tools/admin/:year
// ─────────────────────────────────────────────────────────────────────────────
export const adminSaveYearConfig = async (req, res) => {
  try {
    const { year } = req.params;
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ success: false, error: "metadata is required" });
    }

    metadata.financialYear = year;

    const result = await getPool().query(
      `UPDATE tax_tools
       SET metadata = $1, updated_at = CURRENT_TIMESTAMP
       WHERE category = 'tax_calculator'
         AND metadata->>'financialYear' = $2
       RETURNING *`,
      [metadata, year]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Year not found" });
    }

    res.json({ success: true, row: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: DELETE A YEAR                          ← NEW
// DELETE /tax-tools/admin/:year
// ─────────────────────────────────────────────────────────────────────────────
export const adminDeleteYear = async (req, res) => {
  try {
    const { year } = req.params;

    // Safety: refuse if it's the only year left
    const countResult = await getPool().query(
      `SELECT COUNT(*) FROM tax_tools WHERE category = 'tax_calculator'`
    );
    if (Number(countResult.rows[0].count) <= 1) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete the only financial year. Create another year first.",
      });
    }

    const result = await getPool().query(
      `DELETE FROM tax_tools
       WHERE category = 'tax_calculator'
         AND metadata->>'financialYear' = $1
       RETURNING id`,
      [year]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Year not found" });
    }

    res.json({ success: true, deleted: year });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ROUTES
// ─────────────────────────────────────────────────────────────────────────────
export const getCalculatorConfig = async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT * FROM tax_tools WHERE category = 'calculator' AND is_active = true LIMIT 1`
    );
    res.json({ success: true, taxTools: result.rows[0] || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCalculatorConfig = async (req, res) => {
  try {
    const { title, content, metadata } = req.body;
    const result = await getPool().query(
      `UPDATE tax_tools SET title=$1, content=$2, metadata=$3, updated_at=CURRENT_TIMESTAMP
       WHERE category='calculator' RETURNING *`,
      [title, content, metadata]
    );
    res.json({ success: true, taxTools: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRegimeConfig = async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT * FROM tax_tools WHERE category = 'regime' AND is_active = true LIMIT 1`
    );
    res.json({ success: true, taxTools: result.rows[0] || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRegimeConfig = async (req, res) => {
  try {
    const { title, content, metadata } = req.body;
    const result = await getPool().query(
      `UPDATE tax_tools SET title=$1, content=$2, metadata=$3, updated_at=CURRENT_TIMESTAMP
       WHERE category='regime' RETURNING *`,
      [title, content, metadata]
    );
    res.json({ success: true, taxTools: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT METADATA SCAFFOLD
// ─────────────────────────────────────────────────────────────────────────────
function defaultMetadataScaffold(financialYear) {
  return {
    financialYear,
    newRegime: {
      standardDeduction: 75000,
      rebateLimit: 1200000,
      slabs: [
        { from: 0,       to: 400000,  rate: 0  },
        { from: 400000,  to: 800000,  rate: 5  },
        { from: 800000,  to: 1200000, rate: 10 },
        { from: 1200000, to: 1600000, rate: 15 },
        { from: 1600000, to: 2000000, rate: 20 },
        { from: 2000000, to: 2400000, rate: 25 },
        { from: 2400000, to: null,    rate: 30 },
      ],
    },
    oldRegime: {
      general: {
        standardDeduction: 50000,
        exemptionLimit: 250000,
        rebateLimit: 500000,
        slabs: [
          { from: 0,       to: 250000,  rate: 0  },
          { from: 250000,  to: 500000,  rate: 5  },
          { from: 500000,  to: 1000000, rate: 20 },
          { from: 1000000, to: null,    rate: 30 },
        ],
      },
      senior: {
        standardDeduction: 50000,
        exemptionLimit: 300000,
        rebateLimit: 500000,
        slabs: [
          { from: 0,       to: 300000,  rate: 0  },
          { from: 300000,  to: 500000,  rate: 5  },
          { from: 500000,  to: 1000000, rate: 20 },
          { from: 1000000, to: null,    rate: 30 },
        ],
      },
      super_senior: {
        standardDeduction: 50000,
        exemptionLimit: 500000,
        rebateLimit: 500000,
        slabs: [
          { from: 0,       to: 500000,  rate: 0  },
          { from: 500000,  to: 1000000, rate: 20 },
          { from: 1000000, to: null,    rate: 30 },
        ],
      },
    },
    sliderLimits: {
      incomeMax:      5000000,
      allowancesMax:  3000000,
      deductionsMax:  3000000,
      npsMax:         1000000,
      tdsMax:         2500000,
    },
    personaMessages: {
      salaried:   "Finalize your tax and File your ITR now",
      freelancer: "Since you're a freelancer please reach out to our professional for accurate tax filing",
      business:   "Since you fall under sole proprietor / Business profile please reach out to us for accurate tax filing",
    },
  };
}