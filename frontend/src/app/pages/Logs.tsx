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
import { Activity, CheckCircle, Upload, User as UserIcon, Download } from "lucide-react";
import { exportToCSV } from "../utils/exportUtils";

const logs = [
  {
    action: "Payment Verified",
    description: "Payment verified for order DTR-2024-001234",
    admin: "Admin User",
    timestamp: "15 Jan 2024, 3:45 PM",
    type: "payment",
    icon: CheckCircle,
  },
  {
    action: "Document Approved",
    description: "Form 16 approved for Rajesh Kumar",
    admin: "Admin User",
    timestamp: "15 Jan 2024, 2:30 PM",
    type: "document",
    icon: Upload,
  },
  {
    action: "Filing Updated",
    description: "Status changed to 'In Review' for DTR-2024-001234",
    admin: "Admin User",
    timestamp: "15 Jan 2024, 2:00 PM",
    type: "filing",
    icon: Activity,
  },
  {
    action: "Admin Login",
    description: "Admin User logged in successfully",
    admin: "System",
    timestamp: "15 Jan 2024, 9:00 AM",
    type: "security",
    icon: UserIcon,
  },
];

export function Logs() {
  const handleExport = () => {
    const exportData = logs.map((log) => ({
      "Action": log.action,
      "Description": log.description,
      "Admin": log.admin,
      "Timestamp": log.timestamp,
      "Type": log.type,
    }));
    exportToCSV(exportData, "activity_logs");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Activity Logs</h1>
          <p className="text-text-mid mt-1">Track all admin actions and system events</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Total Actions</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">2,847</p>
            <p className="text-sm text-text-mid mt-2">This month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Payment Actions</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">892</p>
            <p className="text-sm text-green-600 mt-2">Verifications</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Document Actions</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">1,234</p>
            <p className="text-sm text-blue-600 mt-2">Approvals</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Login Events</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">147</p>
            <p className="text-sm text-text-mid mt-2">Successful logins</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => {
                const Icon = log.icon;
                return (
                  <TableRow key={index} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-light rounded-lg">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-mid">{log.description}</TableCell>
                    <TableCell className="text-text-mid">{log.admin}</TableCell>
                    <TableCell className="text-sm text-text-light">{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg capitalize">
                        {log.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
