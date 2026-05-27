import { useEffect, useMemo, useState } from "react";

import { auth } from "../../lib/firebase";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

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
  Mail,
  Phone as PhoneIcon,
  Download,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";

import {
  exportToCSV,
} from "../utils/exportUtils";

export function Customers() {

  const [customers, setCustomers] =
  useState<any[]>([]);

  const [searchTerm, setSearchTerm] =
  useState("");



  useEffect(() => {

    fetchCustomers();

  }, []);




  const fetchCustomers = async () => {

    try {

      const token =
      await auth.currentUser?.getIdToken();

      const response = await fetch(
        "http://localhost:5000/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {

        setCustomers(
          data.customers || []
        );
      }

    } catch (error) {

      console.log(error);
    }
  };




  const filteredCustomers =
  useMemo(() => {

    return customers.filter(
      (customer: any) => {

        const search =
        searchTerm.toLowerCase();

        return (

          customer.name
            ?.toLowerCase()
            .includes(search) ||

          customer.email
            ?.toLowerCase()
            .includes(search) ||

          customer.phone
            ?.toLowerCase()
            .includes(search)

        );
      }
    );

  }, [customers, searchTerm]);




  const handleExport = () => {

    const exportData =
    filteredCustomers.map(
      (customer: any) => ({

        Name:
          customer.name || "No Name",

        Email:
          customer.email || "No Email",

        Phone:
          customer.phone || "No Phone",

      })
    );

    exportToCSV(
      exportData,
      "customers"
    );
  };




  return (

    <div className="space-y-6">




      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-semibold text-text-dark">
            Customer Management
          </h1>

          <p className="text-text-mid mt-1">
            Manage all registered customer accounts
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




      {/* TOTAL USERS CARD */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardContent className="pt-6">

          <p className="text-sm text-text-light">
            Total Users Logged In
          </p>

          <p className="text-4xl font-bold text-text-dark mt-2">
            {customers.length}
          </p>

          <p className="text-sm text-green-600 mt-2">
            Live database users
          </p>

        </CardContent>

      </Card>




      {/* CUSTOMER TABLE */}
      <Card className="rounded-2xl border-0 shadow-sm">

        <CardHeader>

          <div className="flex items-center justify-between">

            <CardTitle>
              All Customers
            </CardTitle>




            <div className="relative w-80">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />

              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10 rounded-xl bg-secondary border-0"
              />

            </div>

          </div>

        </CardHeader>




        <CardContent>

          <Table>

            <TableHeader>

              <TableRow className="hover:bg-transparent border-border">

                <TableHead>
                  Customer
                </TableHead>

                <TableHead>
                  Contact Details
                </TableHead>

              </TableRow>

            </TableHeader>




            <TableBody>

              {filteredCustomers.map(
                (customer: any) => (

                  <TableRow
                    key={customer.id}
                    className="border-border"
                  >




                    {/* CUSTOMER */}
                    <TableCell>

                      <div className="flex items-center gap-3">

                        <Avatar>

                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">

                            {customer.name
                              ? customer.name
                                  .split(" ")
                                  .map(
                                    (n: string) =>
                                      n[0]
                                  )
                                  .join("")
                              : "NA"}

                          </AvatarFallback>

                        </Avatar>




                        <div>

                          <div className="font-medium">
                            {customer.name || "No Name"}
                          </div>

                          <div className="text-sm text-text-mid">
                            Customer Account
                          </div>

                        </div>

                      </div>

                    </TableCell>




                    {/* CONTACT */}
                    <TableCell>

                      <div className="space-y-1">

                        <div className="flex items-center gap-2 text-sm text-text-mid">

                          <Mail className="w-3 h-3" />

                          {customer.email || "No Email"}

                        </div>




                        <div className="flex items-center gap-2 text-sm text-text-mid">

                          <PhoneIcon className="w-3 h-3" />

                          {customer.phone || "No Phone"}

                        </div>

                      </div>

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