import { useEffect, useMemo, useState } from "react";

import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";

import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "../components/ui/card";

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

import { Download } from "lucide-react";

import {
exportToCSV,
} from "../utils/exportUtils";

export function Callbacks() {

const [callbacks, setCallbacks] =
useState<any[]>([]);

const [loading, setLoading] =
useState(true);

useEffect(() => {
fetchCallbacks();
}, []);

const fetchCallbacks = async () => {

try {

  const token =
  await auth.currentUser?.getIdToken();

  const response =
  await fetch(
    `${API_BASE_URL}/callbacks`,
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

    setCallbacks(
      data.callbacks || []
    );
  }

} catch (error) {

  console.log(error);

} finally {

  setLoading(false);
}

};

const updateStatus = async (
  callbackId: string,
  status: string
) => {

  try {

    const token =
      await auth.currentUser?.getIdToken();

    const response =
      await fetch(

        `${API_BASE_URL}/callbacks/${callbackId}/status`,

        {
          method: "PUT",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

    const data =
      await response.json();

    if (data.success) {

      setCallbacks((prev) =>
        prev.map((callback) =>
          callback.id === callbackId
            ? {
                ...callback,
                status,
              }
            : callback
        )
      );
    }

  } catch (error) {

    console.log(error);
  }
};

const handleExport = () => {


const exportData =
callbacks.map((callback) => ({

  Customer:
  callback.customer_name,

  Email:
  callback.customer_email,

  Phone:
  callback.phone,

  Issue:
  callback.issue,

  Status:
  callback.status,

  Date:
  new Date(
    callback.created_at
  ).toLocaleDateString(),

}));

exportToCSV(
  exportData,
  "callbacks"
);

};

const pendingCount =
useMemo(
() =>
callbacks.filter(
(c) =>
c.status === "Pending"
).length,
[callbacks]
);

const completedCount =
useMemo(
() =>
callbacks.filter(
(c) =>
c.status === "Completed"
).length,
[callbacks]
);

if (loading) {


return (
  <div className="p-10 text-center">
    Loading callbacks...
  </div>
);


}

return (


<div className="space-y-6">

  <div className="flex items-center justify-between">

    <div>

      <h1 className="text-3xl font-semibold text-text-dark">
        Callback Requests
      </h1>

      <p className="text-text-mid mt-1">
        Manage customer callback requests
      </p>

    </div>

    <Button
      className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
      onClick={handleExport}
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <Card className="rounded-2xl border-0 shadow-sm">

      <CardContent className="pt-6">

        <p className="text-sm text-text-light">
          Pending Callbacks
        </p>

        <p className="text-3xl font-semibold text-text-dark mt-1">
          {pendingCount}
        </p>

      </CardContent>

    </Card>

    <Card className="rounded-2xl border-0 shadow-sm">

      <CardContent className="pt-6">

        <p className="text-sm text-text-light">
          Completed Callbacks
        </p>

        <p className="text-3xl font-semibold text-text-dark mt-1">
          {completedCount}
        </p>

      </CardContent>

    </Card>

  </div>

  <Card className="rounded-2xl border-0 shadow-sm">

    <CardHeader>

      <CardTitle>
        All Callback Requests
      </CardTitle>

    </CardHeader>

    <CardContent>

      <Table>

        <TableHeader>

          <TableRow className="hover:bg-transparent border-border">

            <TableHead>
              Customer
            </TableHead>

            <TableHead>
              Phone
            </TableHead>

            <TableHead>
              Issue
            </TableHead>

            <TableHead>
              Date
            </TableHead>

            <TableHead>
              Status
            </TableHead>

          </TableRow>

        </TableHeader>

        <TableBody>

          {callbacks.map((callback) => (

            <TableRow
              key={callback.id}
              className="border-border"
            >

              <TableCell className="font-medium">
                {callback.customer_name}
              </TableCell>

              <TableCell>
                {callback.phone}
              </TableCell>

              <TableCell>
                {callback.issue}
              </TableCell>

              <TableCell>

                {new Date(
                  callback.created_at
                ).toLocaleDateString()}

              </TableCell>

              <TableCell>

  <select

    value={callback.status}

    onChange={(e) =>
      updateStatus(
        callback.id,
        e.target.value
      )
    }

    className="px-3 py-2 rounded-lg border border-border bg-white text-sm"

  >

    <option value="Pending">
      Pending
    </option>


    <option value="Completed">
      Completed
    </option>

  </select>

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
