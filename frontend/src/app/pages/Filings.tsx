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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import {
  Search,
  Download,
  MoreVertical,
  Eye,
  UserPlus,
  FileUp,
  CheckCircle,
} from "lucide-react";

import { Link } from "react-router";

import { exportToCSV } from "../utils/exportUtils";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    "In Review": "bg-blue-100 text-blue-700 border-blue-200",
    Filed: "bg-purple-100 text-purple-700 border-purple-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Rejected: "bg-red-100 text-red-700 border-red-200",
  };

  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

export function Filings() {

  const [filings, setFilings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {

    const fetchFilings = async () => {
      try {

        const token = await auth.currentUser?.getIdToken();

        const response = await fetch(
          "http://localhost:5000/filings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(data);

        if (data.success) {
          setFilings(data.filings);
        }

      } catch (error) {
        console.log(error);
      }
    };

    fetchFilings();

  }, []);

  const handleExport = () => {

    const exportData = filings.map((filing: any) => ({
      ID: filing.id,
      Customer: filing.customer_name,
      Phone: filing.phone,
      FilingType: filing.filing_type,
      Status: filing.status,
    }));

    exportToCSV(exportData, "filings");
  };

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-semibold text-text-dark">
            Filings Management
          </h1>

          <p className="text-text-mid mt-1">
            Track and manage all tax filing submissions
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

      {/* Filters */}

      <Card className="rounded-2xl border-0 shadow-sm">

        <CardContent className="pt-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="relative lg:col-span-2">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />

              <Input
                placeholder="Search filings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-secondary border-0"
              />

            </div>

            <Select defaultValue="all-years">

              <SelectTrigger className="rounded-xl bg-secondary border-0">
                <SelectValue placeholder="Filing Year" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all-years">
                  All Years
                </SelectItem>
              </SelectContent>

            </Select>

            <Select defaultValue="all-status">

              <SelectTrigger className="rounded-xl bg-secondary border-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all-status">
                  All Status
                </SelectItem>

              </SelectContent>

            </Select>

            <Select defaultValue="all-payment">

              <SelectTrigger className="rounded-xl bg-secondary border-0">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all-payment">
                  All Payments
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

        </CardContent>

      </Card>

      {/* Table */}

      <Card className="rounded-2xl border-0 shadow-sm">

        <CardHeader>

          <CardTitle>
            All Filings ({filings.length})
          </CardTitle>

        </CardHeader>

        <CardContent>

          <Table>

            <TableHeader>

              <TableRow className="hover:bg-transparent border-border">

                <TableHead>ID</TableHead>

                <TableHead>Customer</TableHead>

                <TableHead>Filing Type</TableHead>

                <TableHead>Status</TableHead>

                <TableHead>Progress</TableHead>

                <TableHead>Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {filings.map((filing: any) => (

                <TableRow
                  key={filing.id}
                  className="border-border"
                >

                  <TableCell>

                    <div>

                      <div className="font-medium text-primary">
                        {filing.id || "No ID"}
                      </div>

                      <div className="text-sm text-text-light">
                        Recently Updated
                      </div>

                    </div>

                  </TableCell>

                  <TableCell>

                    <div>

                      <div className="font-medium">
                        {filing.customer_name || "No Customer"}
                      </div>

                      <div className="text-sm text-text-mid">
                        {filing.customer_phone || "No Phone"}
                      </div>

                    </div>

                  </TableCell>

                  <TableCell>

                    <Badge
                      variant="outline"
                      className="rounded-lg"
                    >
                      {filing.filing_type || "ITR"}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    <Badge
                      className={`rounded-lg border ${getStatusColor(
                        filing.status || "Pending"
                      )}`}
                    >
                      {filing.status || "Pending"}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    <div className="flex items-center gap-2">

                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">

                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: "50%" }}
                        />

                      </div>

                      <span className="text-sm text-text-mid min-w-[3rem]">
                        50%
                      </span>

                    </div>

                  </TableCell>

                  <TableCell>

                    <DropdownMenu>

                      <DropdownMenuTrigger asChild>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">

                        <DropdownMenuItem asChild>

                          <Link
                            to={`/filings/${filing.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>

                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Operator
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <FileUp className="w-4 h-4 mr-2" />
                          Upload Acknowledgement
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Completed
                        </DropdownMenuItem>

                      </DropdownMenuContent>

                    </DropdownMenu>

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