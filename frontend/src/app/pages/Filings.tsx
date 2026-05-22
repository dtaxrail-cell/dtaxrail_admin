import { useState } from "react";
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
import { Search, Filter, Download, MoreVertical, Eye, UserPlus, FileUp, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import { exportToCSV } from "../utils/exportUtils";

const filings = [
  {
    orderId: "DTR-2024-001234",
    customerName: "Rajesh Kumar",
    pan: "ABCDE1234F",
    phone: "+91 98765 43210",
    filingType: "ITR-1",
    filingYear: "AY 2023-24",
    status: "In Review",
    paymentStatus: "Paid",
    assignedAdmin: "Admin User",
    documentsCount: 8,
    completionPercentage: 65,
    lastUpdated: "2 hours ago",
  },
  {
    orderId: "DTR-2024-001235",
    customerName: "Priya Sharma",
    pan: "FGHIJ5678K",
    phone: "+91 98765 43211",
    filingType: "ITR-2",
    filingYear: "AY 2023-24",
    status: "Pending",
    paymentStatus: "Payment Pending",
    assignedAdmin: "Unassigned",
    documentsCount: 5,
    completionPercentage: 30,
    lastUpdated: "3 hours ago",
  },
  {
    orderId: "DTR-2024-001236",
    customerName: "Amit Patel",
    pan: "KLMNO9012P",
    phone: "+91 98765 43212",
    filingType: "ITR-3",
    filingYear: "AY 2023-24",
    status: "Filed",
    paymentStatus: "Paid via UPI",
    assignedAdmin: "Admin User",
    documentsCount: 12,
    completionPercentage: 100,
    lastUpdated: "5 hours ago",
  },
  {
    orderId: "DTR-2024-001237",
    customerName: "Sneha Reddy",
    pan: "QRSTU3456V",
    phone: "+91 98765 43213",
    filingType: "ITR-1",
    filingYear: "AY 2023-24",
    status: "Completed",
    paymentStatus: "Paid",
    assignedAdmin: "Admin User",
    documentsCount: 7,
    completionPercentage: 100,
    lastUpdated: "1 day ago",
  },
  {
    orderId: "DTR-2024-001238",
    customerName: "Vikram Singh",
    pan: "WXYZ7890A",
    phone: "+91 98765 43214",
    filingType: "ITR-4",
    filingYear: "AY 2023-24",
    status: "Pending",
    paymentStatus: "Verification Pending",
    assignedAdmin: "Unassigned",
    documentsCount: 3,
    completionPercentage: 20,
    lastUpdated: "1 day ago",
  },
  {
    orderId: "DTR-2024-001239",
    customerName: "Anjali Verma",
    pan: "BCDEF2345G",
    phone: "+91 98765 43215",
    filingType: "ITR-2",
    filingYear: "AY 2023-24",
    status: "In Review",
    paymentStatus: "Paid",
    assignedAdmin: "Admin User",
    documentsCount: 9,
    completionPercentage: 75,
    lastUpdated: "2 days ago",
  },
];

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

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Paid: "bg-green-100 text-green-700 border-green-200",
    "Paid via UPI": "bg-green-100 text-green-700 border-green-200",
    "Payment Pending": "bg-amber-100 text-amber-700 border-amber-200",
    "Verification Pending": "bg-orange-100 text-orange-700 border-orange-200",
    Failed: "bg-red-100 text-red-700 border-red-200",
    Refunded: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

export function Filings() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleExport = () => {
    const exportData = filings.map((filing) => ({
      "Order ID": filing.orderId,
      "Customer Name": filing.customerName,
      "PAN": filing.pan,
      "Phone": filing.phone,
      "Filing Type": filing.filingType,
      "Filing Year": filing.filingYear,
      "Status": filing.status,
      "Payment Status": filing.paymentStatus,
      "Assigned Admin": filing.assignedAdmin,
      "Documents Count": filing.documentsCount,
      "Completion %": filing.completionPercentage,
      "Last Updated": filing.lastUpdated,
    }));
    exportToCSV(exportData, "all_filings");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Filings Management</h1>
          <p className="text-text-mid mt-1">Track and manage all tax filing submissions</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark" onClick={handleExport}>
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
                placeholder="Search by order ID, customer name, PAN..."
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
                <SelectItem value="all-years">All Years</SelectItem>
                <SelectItem value="2023-24">AY 2023-24</SelectItem>
                <SelectItem value="2022-23">AY 2022-23</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-status">
              <SelectTrigger className="rounded-xl bg-secondary border-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-payment">
              <SelectTrigger className="rounded-xl bg-secondary border-0">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-payment">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verification">Verification Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filings Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Filings ({filings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer Details</TableHead>
                <TableHead>Filing Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filings.map((filing) => (
                <TableRow key={filing.orderId} className="border-border">
                  <TableCell>
                    <div>
                      <div className="font-medium text-primary">{filing.orderId}</div>
                      <div className="text-sm text-text-light">{filing.lastUpdated}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{filing.customerName}</div>
                      <div className="text-sm text-text-mid">{filing.pan}</div>
                      <div className="text-sm text-text-light">{filing.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="rounded-lg mb-1">
                        {filing.filingType}
                      </Badge>
                      <div className="text-sm text-text-mid">{filing.filingYear}</div>
                      <div className="text-sm text-text-light">{filing.documentsCount} docs</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg border ${getStatusColor(filing.status)}`}>
                      {filing.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg border ${getPaymentStatusColor(filing.paymentStatus)}`}>
                      {filing.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${filing.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-text-mid min-w-[3rem]">
                        {filing.completionPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-text-mid">{filing.assignedAdmin}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/filings/${filing.orderId}`} className="cursor-pointer">
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
