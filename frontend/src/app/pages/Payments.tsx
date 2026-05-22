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
import { CheckCircle, X, Eye, Download } from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

const payments = [
  {
    orderId: "DTR-2024-001234",
    customer: "Rajesh Kumar",
    amount: "₹2,499",
    upiId: "UPI202401151234567890",
    status: "Paid via UPI",
    date: "14 Jan 2024, 11:20 AM",
    verifiedBy: "Admin User",
  },
  {
    orderId: "DTR-2024-001235",
    customer: "Priya Sharma",
    amount: "₹2,499",
    upiId: "Pending",
    status: "Payment Pending",
    date: "15 Jan 2024",
    verifiedBy: "-",
  },
  {
    orderId: "DTR-2024-001236",
    customer: "Amit Patel",
    amount: "₹3,999",
    upiId: "UPI202401141234567891",
    status: "Verification Pending",
    date: "14 Jan 2024, 10:15 AM",
    verifiedBy: "-",
  },
];

export function Payments() {
  const handleExport = () => {
    const exportData = payments.map((payment) => ({
      "Order ID": payment.orderId,
      "Customer": payment.customer,
      "Amount": payment.amount,
      "UPI Transaction ID": payment.upiId,
      "Status": payment.status,
      "Date": payment.date,
      "Verified By": payment.verifiedBy,
    }));
    exportToCSV(exportData, "payments");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Payment Management</h1>
          <p className="text-text-mid mt-1">Track and verify all payment transactions</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Total Collected</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">₹32.4L</p>
            <p className="text-sm text-green-600 mt-2">This month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Pending Verification</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">₹4.2L</p>
            <p className="text-sm text-amber-600 mt-2">23 payments</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Payment Pending</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">₹1.8L</p>
            <p className="text-sm text-text-mid mt-2">12 filings</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Refunded</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">₹24K</p>
            <p className="text-sm text-text-mid mt-2">4 cases</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UPI Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.orderId} className="border-border">
                  <TableCell className="font-medium text-primary">{payment.orderId}</TableCell>
                  <TableCell>{payment.customer}</TableCell>
                  <TableCell className="font-semibold">{payment.amount}</TableCell>
                  <TableCell className="font-mono text-sm text-text-mid">{payment.upiId}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg ${
                      payment.status === "Paid via UPI"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : payment.status === "Payment Pending"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-orange-100 text-orange-700 border-orange-200"
                    }`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-mid">{payment.date}</TableCell>
                  <TableCell className="text-sm text-text-mid">{payment.verifiedBy}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {payment.status !== "Paid via UPI" && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
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
