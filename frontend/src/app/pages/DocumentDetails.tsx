import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import {
  ArrowLeft,
  FileText,
  Download,
  FolderOpen,
} from "lucide-react";

import { getAuth } from "firebase/auth";

export function DocumentDetails() {

  const navigate = useNavigate();

  const { filingId } = useParams();

  const [loading, setLoading] =
  useState(true);

  const [filing, setFiling] =
  useState<any>(null);

  const [documents, setDocuments] =
  useState<any[]>([]);




  useEffect(() => {

    const fetchDocuments =
    async () => {

      try {

        const auth = getAuth();

        const user =
        auth.currentUser;

        if (!user) return;

        const token =
        await user.getIdToken();

        const response =
        await fetch(

          `http://localhost:5000/documents/filing/${filingId}`,

          {
            headers: {
              Authorization:
              `Bearer ${token}`,
            },
          }
        );

        const data =
        await response.json();

        console.log(data);

        if (data.success) {

          setFiling(data.filing);

          setDocuments(
            data.documents
          );
        }

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };

    fetchDocuments();

  }, [filingId]);




  if (loading) {

    return (
      <div className="p-10">
        Loading documents...
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-[#f6f8fc] p-6 md:p-8">

      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">

          <div className="flex items-start gap-4">

            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-11 w-11"
              onClick={() =>
                navigate("/documents")
              }
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

                    {filing?.customer_name}

                  </h1>

                  <p className="text-text-mid mt-1">

                    Filing Documents

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

              <div>

                <h2 className="text-3xl font-bold text-text-dark">

                  {filing?.customer_name}

                </h2>

                <div className="mt-3 space-y-1">

                  <p className="text-text-mid text-base">

                    PAN:
                    <span className="font-semibold">
                      {" "}
                      {filing?.pan_number || "N/A"}
                    </span>

                  </p>

                  <p className="text-text-mid text-base">

                    Filing ID:
                    <span className="font-semibold">
                      {" "}
                      {filing?.id}
                    </span>

                  </p>

                  <p className="text-text-light text-sm">

                    {filing?.assessment_year}

                  </p>

                </div>
              </div>





              {/* STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-[#f8fafc] rounded-2xl p-4 min-w-[120px]">

                  <p className="text-sm text-text-light">
                    Documents
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    {documents.length}
                  </h3>

                </div>

                <div className="bg-blue-50 rounded-2xl p-4 min-w-[150px]">

                  <p className="text-sm text-blue-700">
                    Filing Status
                  </p>

                  <Badge className="mt-2 bg-amber-100 text-amber-700 border-amber-200">

                    {filing?.status}

                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>







        {/* DOCUMENTS */}
        <Card className="rounded-3xl border-0 shadow-sm">

          <CardContent className="p-7">

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-text-dark">

                Uploaded Documents

              </h2>

            </div>

            <div className="space-y-5">

              {documents.map((doc) => (

                <div
                  key={doc.id}
                  className="bg-[#fafcff] border border-gray-100 rounded-3xl p-5"
                >

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div className="flex items-center gap-4">

                      <div className="p-4 rounded-2xl bg-primary-light">

                        <FileText className="w-7 h-7 text-primary" />

                      </div>

                      <div>

                        <h3 className="text-lg font-semibold text-text-dark">

                          {doc.document_name}

                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-mid">

                          <span>
                            {doc.mime_type}
                          </span>

                          <span className="w-1 h-1 bg-gray-400 rounded-full" />

                          <span>

                            {new Date(
                              doc.created_at
                            ).toLocaleDateString()}

                          </span>

                        </div>
                      </div>
                    </div>





                    {/* ACTIONS */}
                    <div className="flex flex-wrap items-center gap-3">

                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">

                        {doc.status}

                      </Badge>

                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() =>
                          window.open(
                            doc.file_url,
                            "_blank"
                          )
                        }
                      >

                        <Download className="w-4 h-4 mr-2" />

                        Download

                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}