
import { useEffect, useState } from "react";

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
  IndianRupee,
  CheckCircle,
  Clock,
} from "lucide-react";

const getPaymentColor = (
  status: string
) => {

  const colors: Record<string, string> = {

    Pending:
      "bg-amber-100 text-amber-700 border-amber-200",

    Completed:
      "bg-green-100 text-green-700 border-green-200",

    Failed:
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
  payments.filter((payment) => {

    const search =
    searchTerm.toLowerCase();

    return (

      payment.customer_name
        ?.toLowerCase()
        .includes(search)

      ||

      payment.member_name
        ?.toLowerCase()
        .includes(search)

      ||

      payment.filing_type
        ?.toLowerCase()
        .includes(search)

      ||

      payment.payment_status
        ?.toLowerCase()
        .includes(search)
    );
  });




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
          Track completed and pending filing payments
        </p>

      </div>





      {/* SEARCH */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardContent className="pt-6">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />

            <Input
              placeholder="Search customer, member, filing type..."
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
                  Filing Type
                </TableHead>

                <TableHead>
                  Assessment Year
                </TableHead>

                <TableHead>
                  Amount
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

                    <div>

                      <div className="font-semibold text-text-dark">

                        {
                          payment.member_name
                          || "Unknown Member"
                        }

                      </div>





                      <div className="text-sm text-text-mid">

                        {
                          payment.relationship
                          || "Self"
                        }

                      </div>

                    </div>

                  </TableCell>





                  {/* CUSTOMER */}
                  <TableCell>

                    <div className="font-medium">

                      {
                        payment.customer_name
                      }

                    </div>

                  </TableCell>





                  {/* FILING TYPE */}
                  <TableCell>

                    <Badge
                      variant="outline"
                      className="rounded-lg"
                    >
                      {
                        payment.filing_type
                      }
                    </Badge>

                  </TableCell>





                  {/* YEAR */}
                  <TableCell>

                    {
                      payment.assessment_year
                    }

                  </TableCell>





                  {/* AMOUNT */}
                  <TableCell>

                    <div className="flex items-center gap-1 font-medium">

                      <IndianRupee className="w-4 h-4" />

                      {
                        payment.amount || 0
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
                          payment.payment_status === "Completed"
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
                      payment.payment_date
                      ? new Date(payment.payment_date)
                        .toLocaleDateString()
                      : "N/A"
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
