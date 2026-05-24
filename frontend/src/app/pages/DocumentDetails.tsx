import { useNavigate, useParams } from "react-router";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Upload,
  Bell,
  FolderOpen,
} from "lucide-react";

const documents = [
  {
    id: 1,
    name: "Aadhar Card.pdf",
    size: "1.2 MB",
    uploaded: "22 May 2026",
    status: "Pending",
  },
  {
    id: 2,
    name: "PAN Card.pdf",
    size: "850 KB",
    uploaded: "22 May 2026",
    status: "Approved",
  },
  {
    id: 3,
    name: "Bank Statement.pdf",
    size: "3.4 MB",
    uploaded: "22 May 2026",
    status: "Pending",
  },
];

export function DocumentDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-6 md:p-8">
      
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* PAGE HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          
          <div className="flex items-start gap-4">
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-11 w-11"
              onClick={() => navigate("/documents")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1">
              
              <div className="flex items-center gap-3 mb-2">
                
                <div className="p-3 rounded-2xl bg-primary-light">
                  <FolderOpen className="w-7 h-7 text-primary" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-text-dark">
                    Customer Documents
                  </h1>

                  <p className="text-text-mid mt-1">
                    Review uploaded customer filing documents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER SUMMARY */}
        <Card className="rounded-3xl border-0 shadow-sm">
          
          <CardContent className="p-7">
            
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

              {/* LEFT */}
              <div>
                <h2 className="text-3xl font-bold text-text-dark">
                  Priyanka
                </h2>

                <div className="mt-3 space-y-1">
                  
                  <p className="text-text-mid text-base">
                    PAN: <span className="font-semibold">ABCDE1234F</span>
                  </p>

                  <p className="text-text-mid text-base">
                    Customer ID:{" "}
                    <span className="font-semibold">{customerId}</span>
                  </p>

                  <p className="text-text-light text-sm">
                    Last updated: 22 May 2026
                  </p>
                </div>
              </div>

              {/* RIGHT STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-[#f8fafc] rounded-2xl p-4 min-w-[120px]">
                  <p className="text-sm text-text-light">
                    Documents
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    3
                  </h3>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-sm text-green-700">
                    Approved
                  </p>

                  <h3 className="text-2xl font-bold mt-1 text-green-700">
                    1
                  </h3>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 min-w-[120px]">
                  <p className="text-sm text-amber-700">
                    Pending
                  </p>

                  <h3 className="text-2xl font-bold mt-1 text-amber-600">
                    2
                  </h3>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 min-w-[150px]">
                  <p className="text-sm text-blue-700">
                    Filing Status
                  </p>

                  <Badge className="mt-2 bg-amber-100 text-amber-700 border-amber-200">
                    Pending Review
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* DOCUMENTS */}
          <div className="xl:col-span-2">

            <Card className="rounded-3xl border-0 shadow-sm">
              
              <CardContent className="p-7">

                <div className="flex items-center justify-between mb-6">
                  
                  <div>
                    <h2 className="text-2xl font-bold text-text-dark">
                      Uploaded Documents
                    </h2>

                    <p className="text-text-mid mt-1">
                      Review and verify customer uploaded files
                    </p>
                  </div>
                </div>

                <div className="space-y-5">

                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-[#fafcff] border border-gray-100 rounded-3xl p-5 transition-all hover:shadow-md"
                    >
                      
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        {/* LEFT */}
                        <div className="flex items-center gap-4">

                          <div className="p-4 rounded-2xl bg-primary-light">
                            <FileText className="w-7 h-7 text-primary" />
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-text-dark">
                              {doc.name}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-mid">
                              <span>{doc.size}</span>

                              <span className="w-1 h-1 bg-gray-400 rounded-full" />

                              <span>{doc.uploaded}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT */}
                        <div className="flex flex-wrap items-center gap-3">

                          <Badge
                            className={
                              doc.status === "Approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }
                          >
                            {doc.status}
                          </Badge>

                          <Button
                            variant="outline"
                            className="rounded-2xl"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>

                          <Button className="rounded-2xl bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>

                          <Button
                            variant="outline"
                            className="rounded-2xl text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ADMIN SIDEBAR */}
          <div>

            <div className="sticky top-6">

              <Card className="rounded-3xl border-0 shadow-sm">

                <CardContent className="p-7">

                  <h2 className="text-2xl font-bold text-text-dark mb-6">
                    Admin Actions
                  </h2>

                  <div className="space-y-4">

                    <Button className="w-full rounded-2xl h-12 text-base">
                      Request Additional Documents
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 text-base"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Final Result
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-12 text-base"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify Customer
                    </Button>

                    <div className="pt-4 border-t">
                      <Button className="w-full rounded-2xl h-12 text-base bg-green-600 hover:bg-green-700">
                        Mark Filing Complete
                      </Button>
                    </div>
                  </div>

                  {/* NOTES */}
                  <div className="mt-8 p-4 rounded-2xl bg-[#f8fafc] border border-gray-100">
                    
                    <h3 className="font-semibold text-text-dark mb-2">
                      Admin Notes
                    </h3>

                    <p className="text-sm text-text-mid leading-relaxed">
                      Customer documents are pending final verification.
                      Additional proof may be required for income validation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}