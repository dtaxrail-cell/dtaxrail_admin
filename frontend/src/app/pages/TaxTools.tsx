import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Calculator, Calendar, TrendingUp, Save } from "lucide-react";

export function TaxTools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">Tax Tools CMS</h1>
        <p className="text-text-mid mt-1">Manage tax calculators, deadlines, and tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tax Deadlines
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-lg">
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-text-dark">ITR Filing Deadline (AY 2023-24)</p>
                <p className="text-sm text-text-mid">For salaried individuals</p>
              </div>
              <p className="font-semibold text-primary">31 Jul 2024</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-text-dark">Advance Tax Q4</p>
                <p className="text-sm text-text-mid">Fourth quarter payment</p>
              </div>
              <p className="font-semibold text-primary">15 Mar 2024</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Tax Regime Comparison
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-lg">
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent-light rounded-lg">
              <p className="font-medium text-text-dark mb-2">Old Tax Regime</p>
              <p className="text-sm text-text-mid">With deductions and exemptions</p>
            </div>
            <div className="p-3 bg-primary-light rounded-lg">
              <p className="font-medium text-text-dark mb-2">New Tax Regime</p>
              <p className="text-sm text-text-mid">Lower rates, no deductions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Income Tax Calculator Settings
            </CardTitle>
            <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-text-dark">Tax Slabs (New Regime)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">0 - 3 Lakhs</label>
                    <Input defaultValue="0%" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">3 - 6 Lakhs</label>
                    <Input defaultValue="5%" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">6 - 9 Lakhs</label>
                    <Input defaultValue="10%" className="rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-text-dark">Deductions (Old Regime)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">80C Limit</label>
                    <Input defaultValue="₹1,50,000" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">80D Limit</label>
                    <Input defaultValue="₹25,000" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm text-text-mid mb-1 block">HRA Exemption</label>
                    <Input defaultValue="Enabled" className="rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
