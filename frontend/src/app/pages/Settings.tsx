import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Save } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-text-dark">Settings</h1>
        <p className="text-text-mid mt-1">Manage system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-dark mb-2 block">
                Platform Name
              </label>
              <Input defaultValue="D Tax Rail" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-dark mb-2 block">
                Support Email
              </label>
              <Input defaultValue="support@dtaxrail.com" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-dark mb-2 block">
                Support Phone
              </label>
              <Input defaultValue="+91 1800 123 4567" className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Email Notifications</p>
                <p className="text-sm text-text-mid">Send filing updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">SMS Notifications</p>
                <p className="text-sm text-text-mid">Send payment reminders via SMS</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Push Notifications</p>
                <p className="text-sm text-text-mid">Send app notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Two-Factor Authentication</p>
                <p className="text-sm text-text-mid">Require 2FA for admin login</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Session Timeout</p>
                <p className="text-sm text-text-mid">Auto logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <label className="text-sm font-medium text-text-dark mb-2 block">
                Timeout Duration (minutes)
              </label>
              <Input defaultValue="30" type="number" className="rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Admin Approvals Required</p>
                <p className="text-sm text-text-mid">Require approval for filing completion</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-dark">Payment Verification</p>
                <p className="text-sm text-text-mid">Manual verification for all payments</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
