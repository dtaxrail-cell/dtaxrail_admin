import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import {
  Download,
  Upload,
  Bell,
  User,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";
import { Textarea } from "../components/ui/textarea";

const filingData = {
  orderId: "DTR-2024-001234",
  customerName: "Rajesh Kumar",
  pan: "ABCDE1234F",
  email: "rajesh.kumar@email.com",
  phone: "+91 98765 43210",
  filingType: "ITR-1",
  filingYear: "AY 2023-24",
  status: "In Review",
  paymentStatus: "Paid",
  paymentAmount: "₹2,499",
  assignedAdmin: "Admin User",
  submissionDate: "15 Jan 2024",
  completionPercentage: 65,
};

const documents = [
  {
    name: "PAN Card",
    type: "PDF",
    uploadDate: "10 Jan 2024",
    status: "Verified",
    size: "245 KB",
  },
  {
    name: "Aadhaar Card",
    type: "PDF",
    uploadDate: "10 Jan 2024",
    status: "Verified",
    size: "312 KB",
  },
  {
    name: "Form 16",
    type: "PDF",
    uploadDate: "12 Jan 2024",
    status: "Verified",
    size: "1.2 MB",
  },
  {
    name: "Salary Slips (Jan-Dec)",
    type: "PDF",
    uploadDate: "12 Jan 2024",
    status: "Pending Review",
    size: "3.4 MB",
  },
  {
    name: "Bank Statement",
    type: "PDF",
    uploadDate: "13 Jan 2024",
    status: "Pending Review",
    size: "892 KB",
  },
];

const timeline = [
  {
    event: "Filing Completed",
    description: "Return filed successfully with acknowledgement number",
    timestamp: "16 Jan 2024, 3:45 PM",
    admin: "Admin User",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    event: "Under Review",
    description: "Documents verified and filing is being processed",
    timestamp: "15 Jan 2024, 2:30 PM",
    admin: "Admin User",
    icon: Clock,
    color: "text-blue-600",
  },
  {
    event: "Payment Verified",
    description: "Payment confirmed via UPI transaction",
    timestamp: "14 Jan 2024, 11:20 AM",
    admin: "Admin User",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    event: "Documents Uploaded",
    description: "Customer uploaded all required documents",
    timestamp: "13 Jan 2024, 9:15 AM",
    admin: "Customer",
    icon: Upload,
    color: "text-purple-600",
  },
  {
    event: "PAN Verified",
    description: "PAN card verified successfully",
    timestamp: "10 Jan 2024, 4:00 PM",
    admin: "Admin User",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export function FilingDetails() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Filing Details</h1>
          <p className="text-text-mid mt-1">{filingData.orderId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
            <Bell className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white text-2xl">
                  {filingData.customerName.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-semibold text-text-dark">{filingData.customerName}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-text-mid">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {filingData.pan}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {filingData.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {filingData.phone}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="rounded-lg bg-blue-100 text-blue-700 border-blue-200">
                    {filingData.filingType}
                  </Badge>
                  <Badge className="rounded-lg bg-purple-100 text-purple-700 border-purple-200">
                    {filingData.filingYear}
                  </Badge>
                  <Badge className="rounded-lg bg-green-100 text-green-700 border-green-200">
                    {filingData.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-sm text-text-light">Filing Progress</p>
                <div className="flex items-center gap-3 mt-1">
                  <Progress value={filingData.completionPercentage} className="w-32" />
                  <span className="text-lg font-semibold text-text-dark">
                    {filingData.completionPercentage}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-light">Assigned To</p>
                <p className="font-medium text-text-dark">{filingData.assignedAdmin}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="rounded-xl h-auto py-4 flex-col gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>Verify Documents</span>
        </Button>
        <Button variant="outline" className="rounded-xl h-auto py-4 flex-col gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Update Filing Stage</span>
        </Button>
        <Button variant="outline" className="rounded-xl h-auto py-4 flex-col gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          <span>Upload Acknowledgement</span>
        </Button>
        <Button variant="outline" className="rounded-xl h-auto py-4 flex-col gap-2">
          <Download className="w-5 h-5 text-orange-600" />
          <span>Download All Docs</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white rounded-xl p-1 shadow-sm">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg">Timeline</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-lg">Payment</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Filing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-text-light">Filing Type</p>
                  <p className="font-medium">{filingData.filingType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Assessment Year</p>
                  <p className="font-medium">{filingData.filingYear}</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Submission Date</p>
                  <p className="font-medium">{filingData.submissionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Current Status</p>
                  <Badge className="rounded-lg bg-blue-100 text-blue-700 border-blue-200 mt-1">
                    {filingData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-text-light">Amount</p>
                  <p className="text-2xl font-semibold text-text-dark">{filingData.paymentAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Payment Status</p>
                  <Badge className="rounded-lg bg-green-100 text-green-700 border-green-200 mt-1">
                    {filingData.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-text-light">Payment Method</p>
                  <p className="font-medium">UPI</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Operator Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-text-light">Assigned To</p>
                  <p className="font-medium">{filingData.assignedAdmin}</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Documents Verified</p>
                  <p className="font-medium">3 of 5</p>
                </div>
                <div>
                  <p className="text-sm text-text-light">Pending Actions</p>
                  <p className="font-medium text-amber-600">2 items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, index) => (
                  <Card key={index} className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-primary-light rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <Badge className={`rounded-lg ${
                          doc.status === "Verified"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}>
                          {doc.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-text-dark mb-1">{doc.name}</h4>
                      <p className="text-sm text-text-light mb-3">{doc.size} • {doc.type}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 rounded-lg">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Filing Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-6">
                <div className="absolute left-6 top-3 bottom-3 w-px bg-border" />
                {timeline.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="relative flex gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-white border-2 flex items-center justify-center z-10 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-text-dark">{item.event}</h4>
                          <span className="text-sm text-text-light">{item.timestamp}</span>
                        </div>
                        <p className="text-text-mid mb-1">{item.description}</p>
                        <p className="text-sm text-text-light">By {item.admin}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-light">Payment Amount</p>
                    <p className="text-3xl font-semibold text-text-dark">{filingData.paymentAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-light">Payment Status</p>
                    <Badge className="rounded-lg bg-green-100 text-green-700 border-green-200 mt-1">
                      {filingData.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-text-light">UPI Transaction ID</p>
                    <p className="font-mono text-sm text-text-dark">UPI202401151234567890</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-light">Payment Date</p>
                    <p className="font-medium text-text-dark">14 Jan 2024, 11:20 AM</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-light">Verified By</p>
                    <p className="font-medium text-text-dark">Admin User</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-light mb-2">Payment Screenshot</p>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                      <FileText className="w-12 h-12 text-text-light mx-auto mb-2" />
                      <p className="text-sm text-text-mid">Payment screenshot uploaded</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-lg">
                        <Eye className="w-3 h-3 mr-2" />
                        View Screenshot
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  Download Receipt
                </Button>
                <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
                  Mark as Verified
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Admin Notes & Remarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add notes or remarks about this filing..."
                className="min-h-[200px] rounded-xl"
              />
              <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
                Save Notes
              </Button>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-text-dark">Previous Notes</h4>
                <div className="space-y-3">
                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs">AU</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">Admin User</p>
                            <p className="text-xs text-text-light">15 Jan 2024, 2:30 PM</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-text-mid">
                        All documents verified. Customer provided clear copies. Ready to proceed with filing.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
