"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/animations/FadeIn";

const productsMock = [
  { id: "prod1", name: "CardioMonitor" },
  { id: "prod2", name: "NeuroLink" },
];

export default function MonitoringPage() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setMessage(null);
      await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/monitoring/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts, frequency, email }),
      });
      setMessage("Preferences saved (mock backend).");
    } catch (e) {
      setMessage("Failed to save preferences.");
    }
  };

  const mockAlerts = [
    { id: 1, title: "EU MDR update", severity: "high", product: "CardioMonitor" },
    { id: 2, title: "FDA safety notice", severity: "medium", product: "NeuroLink" },
  ];

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-forestGreen">Monitoring</h1>
          <p className="text-slateGray text-sm">Set preferences and view mock alerts.</p>
        </div>

        <FadeIn>
          <Card className="p-5 space-y-4">
            <h2 className="text-lg font-semibold text-forestGreen">Preferences</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slateGray">Notification Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm text-slateGray">Frequency</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slateGray">Products</label>
              <div className="flex gap-2 flex-wrap">
                {productsMock.map((p) => (
                  <Button
                    key={p.id}
                    variant={selectedProducts.includes(p.id) ? "primary" : "outline"}
                    size="sm"
                    onClick={() => toggleProduct(p.id)}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} className="bg-deepTeal text-white" size="sm">
                Save Preferences
              </Button>
              {message && <span className="text-sm text-slateGray">{message}</span>}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-forestGreen">Mock Alerts</h2>
              <Badge variant="outline">Demo</Badge>
            </div>
            {mockAlerts.map((a) => (
              <div key={a.id} className="border-b border-slate-100 last:border-b-0 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">{a.title}</p>
                  <p className="text-xs text-slateGray">{a.product}</p>
                </div>
                <Badge variant={a.severity === "high" ? "error" : "warning"}>{a.severity}</Badge>
              </div>
            ))}
          </Card>
        </FadeIn>
      </div>
    </main>
  );
}
