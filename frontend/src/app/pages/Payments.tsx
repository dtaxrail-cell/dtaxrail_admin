import { useEffect, useState } from "react";

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

import {
  CheckCircle,
  X,
  Eye,
  Download,
} from "lucide-react";

import { exportToCSV } from "../utils/exportUtils";

import { auth } from "../../lib/firebase";

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  payment_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  filing_type: string;
}

export function Payments() {

  const [payments, setPayments] = useState<Payment[]>([]);

  const fetchPayments = async () => {
    try {

      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(
        "http://localhost:5000/payments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.success) {
        setPayments(data.payments);
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const updatePaymentStatus = async (
    paymentId: string,
    status: string
  ) => {

    try {

      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(
        `http://localhost:5000/payments/${paymentId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            payment_status: status,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      fetchPayments();

    } catch (error) {
      console.log(error);
    }
  };

  const handleExport = () => {

    const exportData = payments.map((payment) => ({
      Customer: payment.customer_name,
      Email: payment.customer_email,
      Phone: payment.customer_phone,
      Amount: payment.amount,
      Status: payment.payment_status,
      Method: payment.payment_method,
      FilingType: payment.filing_type,
    }));

    exportToCSV(exportData, "payments");
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-semibold text-text-dark">
            Payment Management
          </h1>

          <p className="text-text-mid mt-1">
            Track and verify all payment transactions
          </p>
        </div>

        <Button
          className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Total Payments
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {payments.length}
            </p>

            <p className="text-sm text-green-600 mt-2">
              Live Database
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Completed
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {
                payments.filter(
                  (p) => p.payment_status === "Completed"
                ).length
              }
            </p>

            <p className="text-sm text-green-600 mt-2">
              Verified Payments
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Pending
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {
                payments.filter(
                  (p) => p.payment_status === "Pending"
                ).length
              }
            </p>

            <p className="text-sm text-amber-600 mt-2">
              Awaiting Verification
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Total Revenue
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              ₹
              {
                payments.reduce(
                  (total, payment) =>
                    total + Number(payment.amount),
                  0
                )
              }
            </p>

            <p className="text-sm text-text-mid mt-2">
              Real Payments
            </p>
          </CardContent>
        </Card>

      </div>

      <Card className="rounded-2xl border-0 shadow-sm">

        <CardHeader>
          <CardTitle>
            Recent Payments
          </CardTitle>
        </CardHeader>

        <CardContent>

          <Table>

            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">

                <TableHead>Customer</TableHead>

                <TableHead>Phone</TableHead>

                <TableHead>Amount</TableHead>

                <TableHead>Method</TableHead>

                <TableHead>Filing Type</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Actions</TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>

              {payments.map((payment) => (

                <TableRow
                  key={payment.id}
                  className="border-border"
                >

                  <TableCell className="font-medium">
                    {payment.customer_name}
                  </TableCell>

                  <TableCell>
                    {payment.customer_phone}
                  </TableCell>

                  <TableCell className="font-semibold">
                    ₹{payment.amount}
                  </TableCell>

                  <TableCell>
                    {payment.payment_method}
                  </TableCell>

                  <TableCell>
                    {payment.filing_type}
                  </TableCell>

                  <TableCell>

                    <Badge
                      className={`rounded-lg ${
                        payment.payment_status === "Completed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      {payment.payment_status}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    <div className="flex gap-2">

                      {payment.payment_status !== "Completed" && (

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          onClick={() =>
                            updatePaymentStatus(
                              payment.id,
                              "Completed"
                            )
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>

                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() =>
                          updatePaymentStatus(
                            payment.id,
                            "Failed"
                          )
                        }
                      >
                        <X className="w-4 h-4" />
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