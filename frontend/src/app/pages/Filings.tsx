
import { useEffect, useMemo, useState } from "react";

import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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
  Download,
  ExternalLink,
} from "lucide-react";

import { Link } from "react-router";

import { exportToCSV } from "../utils/exportUtils";

const getStatusColor = (status: string) => {

  const colors: Record<string, string> = {

    Pending:
      "bg-amber-100 text-amber-700 border-amber-200",

    "Under Review":
      "bg-blue-100 text-blue-700 border-blue-200",

    Filed:
      "bg-purple-100 text-purple-700 border-purple-200",

    Completed:
      "bg-green-100 text-green-700 border-green-200",

  };

  return (
    colors[status] ||
    "bg-gray-100 text-gray-700 border-gray-200"
  );
};

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

export function Filings() {

  const [filings, setFilings] =
  useState<any[]>([]);

  const [searchTerm, setSearchTerm] =
  useState("");

  const [loading, setLoading] =
  useState(true);



  useEffect(() => {

    fetchFilings();

  }, []);



  const fetchFilings = async () => {

    try {

      const token =
      await auth.currentUser?.getIdToken();

      const filingsResponse = await fetch(
        `${API_BASE_URL}/filings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const filingsData =
      await filingsResponse.json();



      const paymentsResponse = await fetch(
        `${API_BASE_URL}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const paymentsData =
      await paymentsResponse.json();



      if (filingsData.success) {

        const mergedFilings =
        filingsData.filings.map(
          (filing: any) => {

            const payment =
            paymentsData.payments?.find(
              (p: any) =>
                p.filing_id === filing.id
            );

            return {
              ...filing,
              payment_status:
                payment?.payment_status ||
                "Unpaid",
            };
          }
        );

        setFilings(mergedFilings);
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };



  const updatePaymentStatus = async (
    filingId: string,
    paymentStatus: string
  ) => {

    try {

      const token =
      await auth.currentUser?.getIdToken();

      const response = await fetch(
        `${API_BASE_URL}/payments/filing/${filingId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            payment_status:
              paymentStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {

        setFilings((prev) =>
          prev.map((filing) =>
            filing.id === filingId
              ? {
                  ...filing,
                  payment_status:
                    paymentStatus,
                }
              : filing
          )
        );
      }

    } catch (error) {

      console.log(error);
    }
  };



  const filteredFilings = useMemo(() => {

  return filings.filter((filing) => {

    const search =
    searchTerm
      .toLowerCase()
      .trim();

    const memberName =
      filing.member_name || "";

    const customerName =
      filing.customer_name || "";

    const relationship =
      filing.relationship || "";

    const paymentStatus =
      filing.payment_status || "";

    return (

      memberName
        .toLowerCase()
        .includes(search) ||

      customerName
        .toLowerCase()
        .includes(search) ||

      relationship
        .toLowerCase()
        .includes(search) ||

      paymentStatus
        .toLowerCase()
        .includes(search)

    );
  });

}, [filings, searchTerm]);



  const handleExport = () => {

    const exportData =
    filteredFilings.map(
      (filing: any) => ({

        Member:
          filing.member_name ||
          "No Member",

        Customer:
          filing.customer_name ||
          "No Customer",

        Relationship:
          filing.relationship ||
          "Self",

        FilingStatus:
          filing.status ||
          "Pending",

        PaymentStatus:
          filing.payment_status ||
          "Unpaid",

      })
    );

    exportToCSV(
      exportData,
      "filings"
    );
  };



  if (loading) {

    return (
      <div className="p-10 text-center">
        Loading filings...
      </div>
    );
  }



  return (

    <div className="space-y-6">



      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-semibold text-text-dark">
            Filings Management
          </h1>

          <p className="text-text-mid mt-1">
            Track and manage all family filing submissions
          </p>

        </div>



        <Button
          className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
          onClick={handleExport}
        >

          <Download className="w-4 h-4 mr-2" />

          Export CSV

        </Button>

      </div>



      {/* SEARCH */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardContent className="pt-6">

          <div className="relative">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />

            <Input
              placeholder="Search customer, member, status..."
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
            All Filings (
            {filteredFilings.length}
            )
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
                  Payment Status
                </TableHead>

                <TableHead>
                  Workspace
                </TableHead>

              </TableRow>

            </TableHeader>



            <TableBody>

              {filteredFilings.map(
                (filing: any) => (

                  <TableRow
                    key={filing.id}
                    className="border-border"
                  >



                    {/* MEMBER */}
                    <TableCell>

                      <div>

                        <div className="font-semibold text-lg">
                          {
                            filing.member_name ||
                            "No Member"
                          }
                        </div>

                        <div className="text-sm text-text-mid">
                          {
                            filing.relationship ||
                            "Self"
                          }
                        </div>

                      </div>

                    </TableCell>



                    {/* CUSTOMER */}
                    <TableCell>

                      <div className="font-medium">
                        {
                          filing.customer_name ||
                          "No Customer"
                        }
                      </div>

                    </TableCell>



                    {/* PAYMENT STATUS */}
                    <TableCell>

                      <select

                        value={
                          filing.payment_status ||
                          "Unpaid"
                        }

                        onChange={(e) =>
                          updatePaymentStatus(
                            filing.id,
                            e.target.value
                          )
                        }

                        className={`px-3 py-2 rounded-xl text-sm font-medium border outline-none ${getPaymentColor(
                          filing.payment_status ||
                          "Unpaid"
                        )}`}
                      >

                        <option value="Unpaid">
                          Unpaid
                        </option>

                        <option value="Paid">
                          Paid
                        </option>

                      </select>

                    </TableCell>



                    {/* WORKSPACE */}
                    <TableCell>

                      <Link
                        to={`/filings/${filing.id}`}
                      >

                        <Button className="rounded-xl">

                          Open

                          <ExternalLink className="w-4 h-4 ml-2" />

                        </Button>

                      </Link>

                    </TableCell>

                  </TableRow>
                )
              )}

            </TableBody>

          </Table>

        </CardContent>

      </Card>

    </div>
  );
}
