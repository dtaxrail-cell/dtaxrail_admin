import { useEffect, useState, useCallback } from "react";
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
  Bell,
  Trash2,
  Loader2,
} from "lucide-react";

export function FilingDetails() {

  const { filingId } = useParams();

  const [loading, setLoading] = useState(true);

  const [filing, setFiling] = useState<any>(null);

  const [documents, setDocuments] = useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);

  const [results, setResults] = useState<any[]>([]);

  const [requestMessage, setRequestMessage] = useState("");

  const [status, setStatus] = useState("Pending");

  const [deletingId, setDeletingId] = useState<string | null>(null);




  const fetchFilingDetails = useCallback(async () => {

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

      console.error(error);

    } finally {

      setLoading(false);
    }
  }, [filingId]);




  useEffect(() => {

    if (filingId) {
      fetchFilingDetails();
    }

  }, [filingId, fetchFilingDetails]);




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

      console.error(error);
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

      console.error(error);
    }
  };




  const deleteDocument = async (targetId: string) => {

    if (!targetId) {
      alert("Error: Missing document identifier key.");
      return;
    }

    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;

    try {

      setDeletingId(targetId);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const token = await user.getIdToken();



      const response = await fetch(
        `${API_BASE_URL}/filings/delete-document/${targetId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {

        // ✅ Robust filter handling both schema types
        setDocuments((prev) => prev.filter((d) => d.id !== targetId && d.document_id !== targetId));

        alert("Document deleted successfully");

      } else {

        alert(data.message || "Failed to delete document from server");
      }

    } catch (error) {

      console.error(error);

      alert("An error occurred while deleting the document");

    } finally {

      setDeletingId(null);
    }
  };




  if (loading) {

    return (
      <div className="p-10 text-center text-sm text-text-mid">
        Loading filing details...
      </div>
    );
  }




  if (!filing) {

    return (
      <div className="p-10 text-center text-sm text-text-mid">
        Filing workspace record entry not found.
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




      {/* CARD 1: MEMBER INFO */}
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




      {/* CARD 2: UPLOADED DOCUMENTS */}
      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-center gap-3 mb-6">

            <FileText className="w-6 h-6 text-primary" />

            <h3 className="text-2xl font-bold text-text-dark">
              Uploaded Documents
            </h3>

          </div>



          <div className="space-y-4">

            {documents.length === 0 ? (
              <p className="text-sm text-text-light italic text-center py-4">
                No files uploaded yet by this user.
              </p>
            ) : (
              documents.map((doc) => {
                // ✅ Resolve potential id variance dynamically
                const resolvedId = doc.id || doc.document_id;

                return (
                  <div
                    key={resolvedId}
                    className="border rounded-2xl p-5 flex items-center justify-between gap-4"
                  >

                    <div>

                      <h4 className="text-lg font-semibold text-text-dark">
                        {doc.document_name}
                      </h4>

                      <p className="text-sm text-text-mid mt-1">
                        {doc.mime_type}
                      </p>

                    </div>



                    <div className="flex items-center gap-2">

                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>

                      <Button
                        variant="ghost"
                        onClick={() => deleteDocument(resolvedId)}
                        disabled={deletingId === resolvedId}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl p-2"
                      >
                        {deletingId === resolvedId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </CardContent>

      </Card>




      {/* CARD 3: REQUEST ADDITIONAL DOCUMENTS */}
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




      {/* CARD 4: WORKFLOW MESSAGES */}
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