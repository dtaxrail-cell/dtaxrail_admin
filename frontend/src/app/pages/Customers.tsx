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
import { Search, MoreVertical, Eye, Mail, Phone as PhoneIcon, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { exportToCSV } from "../utils/exportUtils";

const customers = [
  {
    name: "Rajesh Kumar",
    pan: "ABCDE1234F",
    email: "rajesh.kumar@email.com",
    phone: "+91 98765 43210",
    totalFilings: 3,
    activeCases: 1,
    paymentStatus: "All Paid",
    lastActivity: "2 hours ago",
  },
  {
    name: "Priya Sharma",
    pan: "FGHIJ5678K",
    email: "priya.sharma@email.com",
    phone: "+91 98765 43211",
    totalFilings: 1,
    activeCases: 1,
    paymentStatus: "Pending",
    lastActivity: "3 hours ago",
  },
  {
    name: "Amit Patel",
    pan: "KLMNO9012P",
    email: "amit.patel@email.com",
    phone: "+91 98765 43212",
    totalFilings: 5,
    activeCases: 0,
    paymentStatus: "All Paid",
    lastActivity: "5 hours ago",
  },
  {
    name: "Sneha Reddy",
    pan: "QRSTU3456V",
    email: "sneha.reddy@email.com",
    phone: "+91 98765 43213",
    totalFilings: 2,
    activeCases: 0,
    paymentStatus: "All Paid",
    lastActivity: "1 day ago",
  },
];

export function Customers() {
  const handleExport = () => {
    const exportData = customers.map((customer) => ({
      "Name": customer.name,
      "PAN": customer.pan,
      "Email": customer.email,
      "Phone": customer.phone,
      "Total Filings": customer.totalFilings,
      "Active Cases": customer.activeCases,
      "Payment Status": customer.paymentStatus,
      "Last Activity": customer.lastActivity,
    }));
    exportToCSV(exportData, "customers");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Customer Management</h1>
          <p className="text-text-mid mt-1">Manage all customer accounts and their filings</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Total Customers</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">1,284</p>
            <p className="text-sm text-green-600 mt-2">+52 this month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Active Cases</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">147</p>
            <p className="text-sm text-text-mid mt-2">Across all customers</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">New This Month</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">52</p>
            <p className="text-sm text-green-600 mt-2">+18% growth</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Repeat Customers</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">892</p>
            <p className="text-sm text-text-mid mt-2">69% of total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
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
                <TableHead>Customer</TableHead>
                <TableHead>Contact Details</TableHead>
                <TableHead>Total Filings</TableHead>
                <TableHead>Active Cases</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.pan} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {customer.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-text-mid">{customer.pan}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-text-mid">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-mid">
                        <PhoneIcon className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{customer.totalFilings}</span>
                  </TableCell>
                  <TableCell>
                    {customer.activeCases > 0 ? (
                      <Badge className="rounded-lg bg-blue-100 text-blue-700 border-blue-200">
                        {customer.activeCases} Active
                      </Badge>
                    ) : (
                      <span className="text-text-light">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`rounded-lg ${
                      customer.paymentStatus === "All Paid"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>
                      {customer.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-light text-sm">
                    {customer.lastActivity}
                  </TableCell>
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
