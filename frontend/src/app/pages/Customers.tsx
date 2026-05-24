import { useEffect, useState } from "react";

import { auth } from "../../lib/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  MoreVertical,
  Mail,
  Phone as PhoneIcon,
  Download,
} from "lucide-react";

import { Avatar, AvatarFallback } from "../components/ui/avatar";

import { exportToCSV } from "../utils/exportUtils";

export function Customers() {

  const [customers, setCustomers] = useState([]);

  useEffect(() => {

    const fetchCustomers = async () => {
      try {

        const token = await auth.currentUser?.getIdToken();

        const response = await fetch(
          "http://localhost:5000/customers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(data);

        if (data.success) {
          setCustomers(data.customers);
        }

      } catch (error) {
        console.log(error);
      }
    };

    fetchCustomers();

  }, []);

  const handleExport = () => {

    const exportData = customers.map((customer: any) => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone,
    }));

    exportToCSV(exportData, "customers");
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">
            Customer Management
          </h1>

          <p className="text-text-mid mt-1">
            Manage all customer accounts and their filings
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
              Total Customers
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {customers.length}
            </p>

            <p className="text-sm text-green-600 mt-2">
              Live Database Count
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Active Customers
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {customers.length}
            </p>

            <p className="text-sm text-text-mid mt-2">
              Connected from backend
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              New This Month
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {customers.length}
            </p>

            <p className="text-sm text-green-600 mt-2">
              Real-time records
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">
              Synced Customers
            </p>

            <p className="text-3xl font-semibold text-text-dark mt-1">
              {customers.length}
            </p>

            <p className="text-sm text-text-mid mt-2">
              Backend secured
            </p>
          </CardContent>
        </Card>

      </div>

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

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Joined
                </TableHead>

                <TableHead></TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {customers.map((customer: any) => (

                <TableRow
                  key={customer.id}
                  className="border-border"
                >

                  <TableCell>

                    <div className="flex items-center gap-3">

                      <Avatar>

                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">

                          {customer.name
                            ? customer.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                            : "NA"}

                        </AvatarFallback>

                      </Avatar>

                      <div>

                        <div className="font-medium">
                          {customer.name || "No Name"}
                        </div>

                        <div className="text-sm text-text-mid">
                          Customer ID
                        </div>

                      </div>

                    </div>

                  </TableCell>

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

                  <TableCell>

                    <Badge className="rounded-lg bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>

                  </TableCell>

                  <TableCell className="text-text-light text-sm">
                    Recently Added
                  </TableCell>

                  <TableCell>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

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