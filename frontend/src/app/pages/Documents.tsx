import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import {
  FolderOpen,
  FileText,
  ArrowRight,
} from "lucide-react";

import { getAuth } from "firebase/auth";

export function Documents() {

  const navigate = useNavigate();

  const [filings, setFilings] =
  useState<any[]>([]);

  const [loading, setLoading] =
  useState(true);

  const [filter, setFilter] =
  useState("all");





  useEffect(() => {

    const fetchFilings = async () => {

      try {

        const auth = getAuth();

        const user =
        auth.currentUser;

        if (!user) return;

        const token =
        await user.getIdToken();

        const response =
        await fetch(

          "http://localhost:5000/documents/folders",

          {
            headers: {
              Authorization:
              `Bearer ${token}`,
            },
          }
        );

        const data =
        await response.json();

        if (data.success) {

          setFilings(data.folders);
        }

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };

    fetchFilings();

  }, []);





  const filteredCustomers =
  useMemo(() => {

    if (filter === "active") {

      return filings.filter(
        (customer) =>
          customer.document_count > 0
      );
    }

    return filings;

  }, [filings, filter]);





  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-semibold text-text-dark">
            Document Folders
          </h1>

          <p className="text-text-mid mt-1">
            Manage customer filing documents
          </p>

        </div>





        {/* FILTER */}
        <select

          value={filter}

          onChange={(e) =>
            setFilter(e.target.value)
          }

          className="px-4 py-2 rounded-xl border border-border bg-white text-sm outline-none"
        >

          <option value="all">
            All Customers
          </option>

          <option value="active">
            Active Filers
          </option>

        </select>

      </div>





      {loading ? (

        <div className="text-center py-10">
          Loading folders...
        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {filteredCustomers.map((customer) => (

            <Card
              key={customer.id}
              className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all"
            >

              <CardContent className="p-6">

                <div className="flex items-start justify-between mb-5">

                  <div className="p-4 bg-primary-light rounded-2xl">

                    <FolderOpen className="w-10 h-10 text-primary" />

                  </div>





                  <Badge className="bg-blue-100 text-blue-700">

                    {customer.filing_count} Filings

                  </Badge>

                </div>





                <h3 className="text-xl font-semibold text-text-dark mb-1">

                  {customer.name}

                </h3>





          





                <div className="flex items-center gap-2 text-text-light text-sm mb-4">

                  <FileText className="w-4 h-4" />

                  {customer.document_count} Documents

                </div>





                <Button
                  className="w-full rounded-xl"
                  onClick={() =>
                    navigate(
                      `/document-details/${customer.id}`
                    )
                  }
                >

                  Open Customer Folder

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