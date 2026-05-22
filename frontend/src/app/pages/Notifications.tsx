import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bell, Mail, MessageSquare, Send } from "lucide-react";

export function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">Notifications Center</h1>
        <p className="text-text-mid mt-1">Manage and send notifications to customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="rounded-lg">Push</Badge>
            </div>
            <p className="text-sm text-text-light">Push Notifications</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">1,284</p>
            <p className="text-sm text-text-mid mt-2">Sent this month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <Badge className="rounded-lg">SMS</Badge>
            </div>
            <p className="text-sm text-text-light">SMS Messages</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">892</p>
            <p className="text-sm text-text-mid mt-2">Sent this month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="rounded-lg">Email</Badge>
            </div>
            <p className="text-sm text-text-light">Email Notifications</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">2,147</p>
            <p className="text-sm text-text-mid mt-2">Sent this month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Send New Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-sm font-medium text-text-dark mb-2 block">
                Notification Type
              </label>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Bell className="w-4 h-4 mr-2" />
                  Push
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
            <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
