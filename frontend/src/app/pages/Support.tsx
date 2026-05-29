import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { API_BASE_URL } from "../../config/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus } from "lucide-react";

export function Support() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/faqs/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const createFaq = async () => {

    if (!question.trim() || !answer.trim()) {
  alert("Question and Answer are required");
  return;
}

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${API_BASE_URL}/faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, answer }),
      });

      

      const data = await response.json();
      if (data.success) {
        setQuestion("");
        setAnswer("");
        setOpenAdd(false);
        fetchFaqs();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFaq = async (faqId: string, active: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${API_BASE_URL}/faqs/${faqId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: active }),
      });
      fetchFaqs();
    } catch (error) {
      console.log(error);
    }
  };

  const updateFaq = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!selectedFaq) return;

const response = await fetch(
  `${API_BASE_URL}/faqs/${selectedFaq.id}`,{
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, answer }),
      });
      const data = await response.json();
      if (data.success) {
  setQuestion("");
  setAnswer("");
  setSelectedFaq(null);
  setOpenEdit(false);
  fetchFaqs();
}
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
  return (
    <div className="p-10 text-center">
      Loading FAQs...
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text-dark">Support & FAQ Management</h1>
          <p className="text-text-mid mt-1">Manage FAQs and support content</p>
        </div>
        <Button
          className="rounded-xl bg-gradient-to-r from-primary to-primary-dark"
          onClick={() => {
  setQuestion("");
  setAnswer("");
  setOpenAdd(true);
}}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New FAQ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Total FAQs</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">
              {faqs.length}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-text-light">Active FAQs</p>
            <p className="text-3xl font-semibold text-text-dark mt-1">
              {faqs.filter((faq) => faq.is_active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Manage FAQs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-text-mid text-sm">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-text-mid text-sm">No FAQs found.</p>
          ) : (
            faqs.map((faq) => (
              <Card key={faq.id} className="rounded-xl border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="rounded-lg">
                          {faq.category || "General"}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={(checked) =>
                              toggleFaq(faq.id, checked)
                            }
                          />
                          <span className="text-sm text-text-mid">
                            {faq.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-text-dark mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-text-mid text-sm">{faq.answer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        setSelectedFaq(faq);
                        setQuestion(faq.question);
                        setAnswer(faq.answer);
                        setOpenEdit(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add FAQ Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Textarea
            placeholder="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button onClick={createFaq}>Save FAQ</Button>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button onClick={updateFaq}>Update FAQ</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}