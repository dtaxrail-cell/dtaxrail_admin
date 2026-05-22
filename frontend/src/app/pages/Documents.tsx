import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { FileText, CheckCircle, X, Eye, Download } from "lucide-react";

const documents = [
  {
    orderId: "DTR-2024-001234",
    customer: "Rajesh Kumar",
    documentName: "Form 16",
    documentType: "PDF",
    uploadDate: "12 Jan 2024",
    status: "Pending Review",
    size: "1.2 MB",
  },
  {
    orderId: "DTR-2024-001235",
    customer: "Priya Sharma",
    documentName: "Salary Slips",
    documentType: "PDF",
    uploadDate: "13 Jan 2024",
    status: "Pending Review",
    size: "3.4 MB",
  },
  {
    orderId: "DTR-2024-001236",
    customer: "Amit Patel",
    documentName: "Bank Statement",
    documentType: "PDF",
    uploadDate: "14 Jan 2024",
    status: "Verified",
    size: "892 KB",
  },
];

export function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">Document Verification</h1>
        <p className="text-text-mid mt-1">Review and verify customer uploaded documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((doc, index) => (
          <Card key={index} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary-light rounded-xl">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <Badge className={`rounded-lg ${
                  doc.status === "Verified"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-amber-100 text-amber-700 border-amber-200"
                }`}>
                  {doc.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-text-dark mb-1">{doc.documentName}</h3>
              <p className="text-sm text-text-mid mb-1">{doc.customer}</p>
              <p className="text-sm text-text-light mb-1">{doc.orderId}</p>
              <p className="text-sm text-text-light mb-4">{doc.size} • {doc.documentType}</p>
              <div className="flex gap-2">
                {doc.status === "Pending Review" ? (
                  <>
                    <Button size="sm" className="flex-1 rounded-lg bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-300">
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="flex-1 rounded-lg">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Download className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
