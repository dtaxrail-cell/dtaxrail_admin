import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "What documents are required for ITR filing?",
    answer: "For ITR-1 filing, you need PAN card, Aadhaar card, Form 16, bank statement, and salary slips for the financial year.",
    category: "Filing Process",
    active: true,
  },
  {
    question: "How long does ITR processing take?",
    answer: "ITR processing typically takes 5-7 business days after all documents are verified and payment is confirmed.",
    category: "Timeline",
    active: true,
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept UPI payments. Please upload the payment screenshot after making the payment for verification.",
    category: "Payment",
    active: true,
  },
];

export function Support() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Support & FAQ Management</h1>
          <p className="text-text-mid mt-1">Manage FAQs and support content</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-dark">
          <Plus className="w-4 h-4 mr-2" />
          Add New FAQ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card className="rounded-2xl border-0 shadow-sm">
    <CardContent className="pt-6">
      <p className="text-sm text-text-light">Total FAQs</p>
      <p className="text-3xl font-semibold text-text-dark mt-1">48</p>
    </CardContent>
  </Card>

  <Card className="rounded-2xl border-0 shadow-sm">
    <CardContent className="pt-6">
      <p className="text-sm text-text-light">Active FAQs</p>
      <p className="text-3xl font-semibold text-text-dark mt-1">42</p>
    </CardContent>
  </Card>
</div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Manage FAQs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="rounded-lg">
                        {faq.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch checked={faq.active} />
                        <span className="text-sm text-text-mid">
                          {faq.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-text-dark mb-2">{faq.question}</h4>
                    <p className="text-text-mid text-sm">{faq.answer}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
