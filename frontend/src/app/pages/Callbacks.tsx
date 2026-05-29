import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Download } from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

const callbacks = [
  {
    customer: "Rajesh Kumar",
    phone: "+91 98765 43210",
    preferredTime: "2:00 PM - 4:00 PM",
    issue: "Query about ITR filing deadline",
    requestDate: "15 Jan 2024, 10:30 AM",
    status: "Pending",
  },
  {
    customer: "Priya Sharma",
    phone: "+91 98765 43211",
    preferredTime: "5:00 PM - 7:00 PM",
    issue: "Document upload assistance needed",
    requestDate: "15 Jan 2024, 11:45 AM",
    status: "Contacted",
  },
  {
    customer: "Amit Patel",
    phone: "+91 98765 43212",
    preferredTime: "11:00 AM - 1:00 PM",
    issue: "Payment verification status",
    requestDate: "14 Jan 2024, 3:20 PM",
    status: "Completed",
  },
];

export function Callbacks() {
  const handleExport = () => {
    const exportData = callbacks.map((callback) => ({
      "Customer": callback.customer,
      "Phone": callback.phone,
      "Preferred Time": callback.preferredTime,
      "Issue": callback.issue,
      "Request Date": callback.requestDate,
      "Status": callback.status,
    }));
    exportToCSV(exportData, "callbacks");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Callback Requests</h1>
          <p className="text-text-mid mt-1">Manage customer callback requests and support queries</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Pending Callbacks</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">23</p>
            <p className="text-sm text-amber-600 mt-2">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Contacted Today</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">18</p>
            <p className="text-sm text-green-600 mt-2">78% completion</p>
          </CardContent>
        </Card>
      
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Customer</TableHead>
<TableHead>Phone</TableHead>
<TableHead>Request Date</TableHead>
<TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callbacks.map((callback, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell className="font-medium">{callback.customer}</TableCell>
<TableCell className="text-text-mid">{callback.phone}</TableCell>
<TableCell className="text-sm text-text-light">{callback.requestDate}</TableCell>
<TableCell>
  <Badge
    className={`rounded-lg ${
      callback.status === "Pending"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : callback.status === "Contacted"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-green-100 text-green-700 border-green-200"
    }`}
  >
    {callback.status}
  </Badge>
</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
