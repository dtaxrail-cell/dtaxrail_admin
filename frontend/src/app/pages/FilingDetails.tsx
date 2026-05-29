import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { getAuth } from "firebase/auth";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { API_BASE_URL } from "../../config/api";

import {
  FileText,
  Download,
  Upload,
  Bell,
} from "lucide-react";

export function FilingDetails() {

  const { filingId } = useParams();

  const [loading, setLoading] = useState(true);

  const [filing, setFiling] = useState<any>(null);

  const [documents, setDocuments] = useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);

  const [results, setResults] = useState<any[]>([]);

  const [requestMessage, setRequestMessage] =
  useState("");

  const [status, setStatus] =
  useState("Pending");



  useEffect(() => {

    fetchFilingDetails();

  }, []);




  const fetchFilingDetails = async () => {

    try {

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();



      const response = await fetch(
        `${API_BASE_URL}/filings/${filingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();



      if (data.success) {

        setFiling(data.filing);

        setDocuments(data.documents || []);

        setMessages(data.messages || []);

        setResults(data.results || []);

        setStatus(data.filing.status);
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };




  const requestAdditionalDocuments = async () => {

    try {

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();



      const response = await fetch(
        `${API_BASE_URL}/filings/request-documents/${filingId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: requestMessage,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {

        alert("Document request sent");

        setRequestMessage("");

        fetchFilingDetails();
      }

    } catch (error) {

      console.log(error);
    }
  };




  const updateFilingStatus = async (
    newStatus: string
  ) => {

    try {

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();



      const response = await fetch(
        `${API_BASE_URL}/filings/status/${filingId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {

        setStatus(newStatus);

        alert("Status updated");
      }

    } catch (error) {

      console.log(error);
    }
  };




  const uploadResult = async (
    e: any
  ) => {

    try {

      const file = e.target.files[0];

      if (!file) return;



      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();



      const formData = new FormData();

      formData.append("result", file);



      const response = await fetch(
        `${API_BASE_URL}/filings/upload-result/${filingId}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {

        alert("Result uploaded");

        fetchFilingDetails();
      }

    } catch (error) {

      console.log(error);
    }
  };




  if (loading) {

    return (
      <div className="p-10 text-center">
        Loading filing details...
      </div>
    );
  }




  if (!filing) {

    return (
      <div className="p-10 text-center">
        Filing not found
      </div>
    );
  }




  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold text-text-dark">
          Filing Workspace
        </h1>

        <p className="text-text-mid mt-2">
          Manage filing workflow and documents
        </p>

      </div>




      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-start justify-between flex-wrap gap-5">



            <div>

              <h2 className="text-3xl font-bold text-text-dark mb-2">
                {filing.member_name || filing.customer_name}
              </h2>



              <div className="space-y-2 text-text-mid">

                <p>
                  Relationship: {filing.relationship || "Self"}
                </p>

                <p>
                  PAN: {filing.member_pan || "N/A"}
                </p>

                <p>
                  Phone: {filing.member_phone || "N/A"}
                </p>

                <p>
                  Email: {filing.member_email || "N/A"}
                </p>

                <p>
                  Filing Type: {filing.filing_type}
                </p>

                <p>
                  Assessment Year: {filing.assessment_year}
                </p>

              </div>

            </div>





            <div className="flex flex-col gap-3 items-end">

              <Badge
                className={
                  filing.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {status}
              </Badge>



              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  updateFilingStatus(e.target.value);
                }}
                className="border rounded-xl px-4 py-2"
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Under Review">
                  Under Review
                </option>

                <option value="Documents Requested">
                  Documents Requested
                </option>

                <option value="Filed">
                  Filed
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>

            </div>

          </div>

        </CardContent>

      </Card>




      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-center gap-3 mb-6">

            <FileText className="w-6 h-6 text-primary" />

            <h3 className="text-2xl font-bold text-text-dark">
              Uploaded Documents
            </h3>

          </div>



          <div className="space-y-4">

            {documents.map((doc) => (

              <div
                key={doc.id}
                className="border rounded-2xl p-5 flex items-center justify-between"
              >

                <div>

                  <h4 className="text-lg font-semibold">
                    {doc.document_name}
                  </h4>

                  <p className="text-sm text-text-mid mt-1">
                    {doc.mime_type}
                  </p>

                </div>



                <a
                  href={doc.file_url}
                  target="_blank"
                >
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>




      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-center gap-3 mb-6">

            <Bell className="w-6 h-6 text-primary" />

            <h3 className="text-2xl font-bold text-text-dark">
              Request Additional Documents
            </h3>

          </div>



          <Textarea
            placeholder="Example: Please upload bank statement for FY 2024-25"
            value={requestMessage}
            onChange={(e) =>
              setRequestMessage(e.target.value)
            }
            className="min-h-[120px]"
          />



          <Button
            className="mt-4 rounded-xl"
            onClick={requestAdditionalDocuments}
          >
            Send Request
          </Button>

        </CardContent>

      </Card>




      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-center justify-between mb-6">

            <h3 className="text-2xl font-bold text-text-dark">
              Filing Results
            </h3>



            <label>

              <input
                type="file"
                className="hidden"
                onChange={uploadResult}
              />

              <Button asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Result
                </span>
              </Button>

            </label>

          </div>



          <div className="space-y-4">

            {results.map((result) => (

              <div
                key={result.id}
                className="border rounded-2xl p-5 flex items-center justify-between"
              >

                <div>

                  <h4 className="text-lg font-semibold">
                    {result.file_name}
                  </h4>

                  <p className="text-sm text-text-mid mt-1">
                    Final Filing Result
                  </p>

                </div>



                <a
                  href={result.file_url}
                  target="_blank"
                >
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </a>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>




      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <h3 className="text-2xl font-bold text-text-dark mb-6">
            Workflow Messages
          </h3>



          <div className="space-y-4">

            {messages.map((msg) => (

              <div
                key={msg.id}
                className="border rounded-2xl p-5"
              >

                <div className="flex items-center justify-between mb-2">

                  <Badge>
                    {msg.sender_type}
                  </Badge>

                  <span className="text-xs text-text-light">
                    {
                      new Date(msg.created_at)
                      .toLocaleString()
                    }
                  </span>

                </div>

                <p className="text-text-dark">
                  {msg.message}
                </p>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>

    </div>
  );
}