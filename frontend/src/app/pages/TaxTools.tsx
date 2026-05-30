import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import { Calculator, Save } from "lucide-react";

import { API_BASE_URL } from "../../config/api";
import { auth } from "../../lib/firebase";

export function TaxTools() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [taxToolId, setTaxToolId] = useState("");

  const [financialYear, setFinancialYear] = useState("");
  const [rebateLimit, setRebateLimit] = useState("");
  const [standardDeduction, setStandardDeduction] = useState("");

  const [slabs, setSlabs] = useState<any[]>([]);

  useEffect(() => {
    loadTaxTools();
  }, []);

  const loadTaxTools = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tax-tools`
      );

      const data = response.data.taxTools;

      setTaxToolId(data.id);

      setFinancialYear(
        data.metadata.financialYear?.toString() || ""
      );

      setRebateLimit(
        data.metadata.rebateLimit?.toString() || ""
      );

      setStandardDeduction(
        data.metadata.standardDeduction?.toString() || ""
      );

      setSlabs(data.metadata.slabs || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load tax tools");
    } finally {
      setLoading(false);
    }
  };

  const updateSlabRate = (
    index: number,
    value: string
  ) => {
    const updated = [...slabs];

    updated[index] = {
      ...updated[index],
      rate: Number(value),
    };

    setSlabs(updated);
  };

 const saveChanges = async () => {
  try {
    setSaving(true);

    const token =
      await auth.currentUser?.getIdToken();

    await axios.put(
      `${API_BASE_URL}/tax-tools`,
      {
        title: "Income Tax Calculator",
        content: "Tax Calculator Configuration",

        metadata: {
          financialYear,
          rebateLimit: Number(rebateLimit),
          standardDeduction: Number(
            standardDeduction
          ),
          slabs,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Saved Successfully");

  } catch (error) {

    console.error(error);

    alert("Save Failed");

  } finally {

    setSaving(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">
          Tax Tools CMS
        </h1>

        <p className="text-text-mid mt-1">
          Manage Income Tax Calculator
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Income Tax Calculator Settings
          </CardTitle>

          <Button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
          >
            <Save className="w-4 h-4 mr-2" />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-4">
              <h4 className="font-semibold">
                General Settings
              </h4>

              <div>
                <label className="text-sm block mb-1">
                  Financial Year
                </label>

                <Input
                  value={financialYear}
                  onChange={(e) =>
                    setFinancialYear(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm block mb-1">
                  Rebate Limit
                </label>

                <Input
                  value={rebateLimit}
                  onChange={(e) =>
                    setRebateLimit(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm block mb-1">
                  Standard Deduction
                </label>

                <Input
                  value={standardDeduction}
                  onChange={(e) =>
                    setStandardDeduction(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">
                Tax Slabs
              </h4>

              {slabs.map(
                (
                  slab,
                  index
                ) => (
                  <div key={index}>
                    <label className="text-sm block mb-1">
                      ₹
                      {slab.from.toLocaleString()}
                      {" - "}
                      {slab.to
                        ? `₹${slab.to.toLocaleString()}`
                        : "Above"}
                    </label>

                    <Input
                      value={slab.rate}
                      onChange={(e) =>
                        updateSlabRate(
                          index,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}