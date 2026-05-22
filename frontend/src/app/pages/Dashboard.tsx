import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  FileText,
  Clock,
  CheckCircle2,
  CreditCard,
  Phone,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Download,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { exportToCSV } from "../utils/exportUtils";

const statsData = [
  {
    title: "Total Filings",
    value: "1,284",
    change: "+12.5%",
    trend: "up",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Pending Reviews",
    value: "147",
    change: "+8.2%",
    trend: "up",
    icon: Clock,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Completed Returns",
    value: "892",
    change: "+15.3%",
    trend: "up",
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Pending Payments",
    value: "₹4.2L",
    change: "-3.1%",
    trend: "down",
    icon: CreditCard,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Active Callbacks",
    value: "23",
    change: "+5.4%",
    trend: "up",
    icon: Phone,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Open Notices",
    value: "12",
    change: "-16.7%",
    trend: "down",
    icon: AlertCircle,
    color: "from-red-500 to-rose-600",
  },
];

const recentFilings = [
  {
    orderId: "DTR-2024-001234",
    customerName: "Rajesh Kumar",
    pan: "ABCDE1234F",
    filingType: "ITR-1",
    filingYear: "AY 2023-24",
    status: "In Review",
    paymentStatus: "Paid",
    assignedAdmin: "Admin User",
    lastUpdated: "2 hours ago",
  },
  {
    orderId: "DTR-2024-001235",
    customerName: "Priya Sharma",
    pan: "FGHIJ5678K",
    filingType: "ITR-2",
    filingYear: "AY 2023-24",
    status: "Pending",
    paymentStatus: "Payment Pending",
    assignedAdmin: "Unassigned",
    lastUpdated: "3 hours ago",
  },
  {
    orderId: "DTR-2024-001236",
    customerName: "Amit Patel",
    pan: "KLMNO9012P",
    filingType: "ITR-3",
    filingYear: "AY 2023-24",
    status: "Filed",
    paymentStatus: "Paid via UPI",
    assignedAdmin: "Admin User",
    lastUpdated: "5 hours ago",
  },
  {
    orderId: "DTR-2024-001237",
    customerName: "Sneha Reddy",
    pan: "QRSTU3456V",
    filingType: "ITR-1",
    filingYear: "AY 2023-24",
    status: "Completed",
    paymentStatus: "Paid",
    assignedAdmin: "Admin User",
    lastUpdated: "1 day ago",
  },
  {
    orderId: "DTR-2024-001238",
    customerName: "Vikram Singh",
    pan: "WXYZ7890A",
    filingType: "ITR-4",
    filingYear: "AY 2023-24",
    status: "Pending",
    paymentStatus: "Verification Pending",
    assignedAdmin: "Unassigned",
    lastUpdated: "1 day ago",
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

export function Dashboard() {
  const handleExportFilings = () => {
    const exportData = recentFilings.map((filing) => ({
      "Order ID": filing.orderId,
      "Customer Name": filing.customerName,
      "PAN": filing.pan,
      "Filing Type": filing.filingType,
      "Filing Year": filing.filingYear,
      "Status": filing.status,
      "Payment Status": filing.paymentStatus,
      "Assigned Admin": filing.assignedAdmin,
      "Last Updated": filing.lastUpdated,
    }));
    exportToCSV(exportData, "recent_filings");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">Dashboard</h1>
        <p className="text-text-mid mt-1">Welcome back! Here's an overview of your tax operations.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <Card key={index} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-mid">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-text-dark">
                  {stat.value}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-sm ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{stat.change}</span>
                  <span className="text-text-light">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Filings Table */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Filings</CardTitle>
            <p className="text-sm text-text-mid mt-1">Latest tax filing submissions and their status</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={handleExportFilings}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link to="/filings">
              <Button variant="outline" className="rounded-xl">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>PAN</TableHead>
                <TableHead>Filing Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFilings.map((filing) => (
                <TableRow key={filing.orderId} className="border-border">
                  <TableCell className="font-medium text-primary">
                    {filing.orderId}
                  </TableCell>
                  <TableCell className="font-medium">{filing.customerName}</TableCell>
                  <TableCell className="text-text-mid">{filing.pan}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg">
                      {filing.filingType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-mid">{filing.filingYear}</TableCell>
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
                  <TableCell className="text-text-mid">{filing.assignedAdmin}</TableCell>
                  <TableCell className="text-text-light text-sm">{filing.lastUpdated}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
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
