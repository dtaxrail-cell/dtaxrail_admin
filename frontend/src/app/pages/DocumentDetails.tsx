import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import {
  ArrowLeft,
  FolderOpen,
  FileText,
  ArrowRight,
} from "lucide-react";

import { getAuth } from "firebase/auth";

export function DocumentDetails() {

  const navigate = useNavigate();

  const { filingId } = useParams();

  const [filings, setFilings] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);





  useEffect(() => {

    const fetchCustomerFilings = async () => {

      try {

        const auth = getAuth();

        const user = auth.currentUser;

        if (!user) {
          return;
        }

        const token = await user.getIdToken();





        const response = await fetch(
          `http://localhost:5000/documents/customer/${filingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );





        const data = await response.json();





        if (data.success) {

          setFilings(data.filings);
        }

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };





    fetchCustomerFilings();

  }, [filingId]);





  return (

    <div className="space-y-6">





      {/* PAGE HEADER */}
      <div>

        <h1 className="text-3xl font-semibold text-text-dark">
          Family Filing Folders
        </h1>

        <p className="text-text-mid mt-1">
          View all member filings under this customer account
        </p>

      </div>





      {/* BACK BUTTON */}
      <Button
        variant="outline"
        className="rounded-xl"
        onClick={() => navigate("/documents")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Button>





      {/* LOADING */}
      {loading ? (

        <div className="text-center py-10">
          Loading filings...
        </div>

      ) : (





        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">





          {filings.map((filing) => (

            <Card
              key={filing.id}
              className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all"
            >

              <CardContent className="p-6">





                {/* TOP */}
                <div className="flex items-start justify-between mb-5">

                  <div className="p-4 bg-primary-light rounded-2xl">
                    <FolderOpen className="w-10 h-10 text-primary" />
                  </div>

                  <Badge
                    className={
                      filing.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {filing.status}
                  </Badge>

                </div>





                {/* MEMBER NAME */}
                <h3 className="text-2xl font-bold text-text-dark mb-1">
                  {filing.member_name || "Unknown Member"}
                </h3>





                {/* RELATIONSHIP */}
                <p className="text-sm text-primary font-medium mb-3">
                  {filing.relationship || "Family Member"}
                </p>





                {/* DETAILS */}
                <div className="space-y-2 mb-5">

                  <p className="text-sm text-text-mid">
                    PAN: {filing.member_pan || "N/A"}
                  </p>

                  <p className="text-sm text-text-mid">
                    Phone: {filing.member_phone || "N/A"}
                  </p>

                  <p className="text-sm text-text-mid">
                    Filing Year: {filing.assessment_year}
                  </p>

                </div>





                {/* DOC COUNT */}
                <div className="flex items-center gap-2 text-text-light text-sm mb-5">

                  <FileText className="w-4 h-4" />

                  {filing.document_count} Documents

                </div>





                {/* BUTTON */}
                <Button
                  className="w-full rounded-xl"
                  onClick={() =>
                    navigate(`/filings/${filing.id}`)
                  }
                >
                  Open Member Filing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>
  );
}