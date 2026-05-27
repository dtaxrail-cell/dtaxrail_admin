import { useEffect, useMemo, useState } from "react";

import { auth } from "../../lib/firebase";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { Badge } from "../components/ui/badge";

import { Input } from "../components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import {
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";

const getPaymentColor = (
  status: string
) => {

  const colors: Record<string, string> = {

    Paid:
      "bg-green-100 text-green-700 border-green-200",

    Unpaid:
      "bg-red-100 text-red-700 border-red-200",

  };

  return (
    colors[status] ||
    "bg-gray-100 text-gray-700 border-gray-200"
  );
};

export function Payments() {

  const [payments, setPayments] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");





  useEffect(() => {

    fetchPayments();

  }, []);





  const fetchPayments = async () => {

    try {

      const token =
      await auth.currentUser?.getIdToken();

      const response =
      await fetch(

        "http://localhost:5000/payments",

        {
          headers: {
            Authorization:
            `Bearer ${token}`,
          },
        }
      );

      const data =
      await response.json();

      if (data.success) {

        setPayments(data.payments);
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };





  const filteredPayments =
  useMemo(() => {

    return payments.filter((payment) => {

      const search =
      searchTerm
        .toLowerCase()
        .trim();

      const customerName =
        payment.customer_name || "";

      const memberName =
        payment.member_name || "";

      const paymentStatus =
        payment.payment_status || "";

      return (

        customerName
          .toLowerCase()
          .includes(search)

        ||

        memberName
          .toLowerCase()
          .includes(search)

        ||

        paymentStatus
          .toLowerCase()
          .includes(search)

      );
    });

  }, [payments, searchTerm]);





  if (loading) {

    return (

      <div className="p-10 text-center">
        Loading payments...
      </div>
    );
  }





  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div>

        <h1 className="text-3xl font-semibold text-text-dark">
          Payment Management
        </h1>

        <p className="text-text-mid mt-1">
          Track customer payment statuses
        </p>

      </div>





      {/* SEARCH */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardContent className="pt-6">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />

            <Input
              placeholder="Search customer, member, payment..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10 rounded-xl bg-secondary border-0"
            />

          </div>

        </CardContent>

      </Card>





      {/* TABLE */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardHeader>

          <CardTitle>
            All Payments ({filteredPayments.length})
          </CardTitle>

        </CardHeader>





        <CardContent>

          <Table>

            <TableHeader>

              <TableRow className="hover:bg-transparent border-border">

                <TableHead>
                  Member
                </TableHead>

                <TableHead>
                  Customer
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Payment Date
                </TableHead>

              </TableRow>

            </TableHeader>





            <TableBody>

              {filteredPayments.map((payment: any) => (

                <TableRow
                  key={payment.id}
                  className="border-border"
                >

                  {/* MEMBER */}
                  <TableCell>

                    <div className="font-semibold text-text-dark">

                      {
                        payment.member_name
                        || "Unknown Member"
                      }

                    </div>

                  </TableCell>





                  {/* CUSTOMER */}
                  <TableCell>

                    <div className="font-medium">

                      {
                        payment.customer_name
                        || "Unknown Customer"
                      }

                    </div>

                  </TableCell>





                  {/* STATUS */}
                  <TableCell>

                    <Badge
                      className={`rounded-lg border ${getPaymentColor(
                        payment.payment_status
                      )}`}
                    >

                      <div className="flex items-center gap-1">

                        {
                          payment.payment_status === "Paid"
                          ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )
                        }

                        {
                          payment.payment_status
                        }

                      </div>

                    </Badge>

                  </TableCell>





                 {/* DATE */}
<TableCell>

  {
    payment.payment_status === "Paid"

    ? new Date(
        payment.updated_at
      ).toLocaleDateString()

    : "-"
  }

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