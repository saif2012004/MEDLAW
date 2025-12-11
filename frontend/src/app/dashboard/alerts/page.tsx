"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useProject } from "@/context/ProjectContext";
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  X,
  Eye,
  Archive,
  Settings,
  Box,
  ChevronDown
} from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function AlertsPage() {
  const { currentProject } = useProject();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [regulationFilter, setRegulationFilter] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Auto-select first product if available
  useEffect(() => {
    if (currentProject?.products.length && !selectedProductId) {
      setSelectedProductId(currentProject.products[0].id);
    }
  }, [currentProject, selectedProductId]);

  // Prefill filters from classification routing
  useEffect(() => {
    // Handle simple search param
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setRegulationFilter(searchQuery);
      setSelectedFilter("All");
    }
    
    // Handle filters JSON param
    const preset = searchParams.get("filters");
    if (preset) {
      try {
        const parsed = JSON.parse(decodeURIComponent(preset));
        if (parsed.regulation) {
          setRegulationFilter(parsed.regulation);
          setSelectedFilter("Regulatory Updates");
        }
        if (parsed.dateRange) {
          // Placeholder: mock data ignores dates
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [searchParams]);

  const filters = [
    { name: "All", count: 24, color: "text-blue-600" },
    { name: "Regulatory Updates", count: 8, color: "text-purple-600" },
    { name: "Deadlines", count: 5, color: "text-orange-600" },
    { name: "Team Activity", count: 7, color: "text-green-600" },
    { name: "System", count: 4, color: "text-slate-500" },
  ];

  // Mock alerts with productId association
  const alerts = [
    {
      id: 1,
      type: "regulatory",
      priority: "high",
      title: "FDA 21 CFR Part 820 Amendment",
      description: "New guidance document released for Design Control requirements. Effective date: January 15, 2026. Review Section 820.30 for updates to design verification protocols.",
      date: "2 hours ago",
      read: false,
      regulation: "FDA 21 CFR 820",
      impact: "Medium Impact",
      affectedItems: ["Design Control SOP", "DHF Template", "Verification Protocol"],
      productId: currentProject?.products[0]?.id // Associate with first product
    },
    {
      id: 2,
      type: "deadline",
      priority: "high",
      title: "QMS Internal Audit Due in 3 Days",
      description: "Annual Quality Management System audit scheduled for December 15, 2025. Ensure all documentation is current and accessible.",
      date: "4 hours ago",
      read: false,
      daysRemaining: 3,
      assignee: "Sarah Chen",
      progress: 75,
      productId: currentProject?.products[0]?.id
    },
    {
      id: 3,
      type: "team",
      priority: "medium",
      title: "Design Review Meeting Completed",
      description: "Design review for CardioMonitor v2.0 completed. 3 action items assigned requiring follow-up by December 10.",
      date: "5 hours ago",
      read: true,
      user: "Michael Rodriguez",
      actionItems: 3,
      productId: currentProject?.products[1]?.id
    },
    {
      id: 4,
      type: "regulatory",
      priority: "high",
      title: "ISO 14971:2019 Risk Management Update",
      description: "Clarification issued on residual risk evaluation criteria. All active risk assessments should be reviewed for compliance.",
      date: "Yesterday",
      read: false,
      regulation: "ISO 14971",
      impact: "High Impact",
      affectedItems: ["Risk Management Plan", "FMEA Templates", "Risk Assessment Forms"],
      productId: currentProject?.products[0]?.id
    },
    {
      id: 5,
      type: "deadline",
      priority: "medium",
      title: "Supplier Re-evaluation Upcoming",
      description: "Annual supplier evaluation for 5 critical vendors due by December 20, 2025.",
      date: "Yesterday",
      read: true,
      daysRemaining: 20,
      assignee: "Emily Watson",
      progress: 40,
      productId: currentProject?.products[1]?.id
    },
    {
      id: 6,
      type: "system",
      priority: "low",
      title: "Storage Limit Approaching",
      description: "You've used 8.4 GB of your 50 GB storage limit. Consider archiving old documents or upgrading your plan.",
      date: "2 days ago",
      read: true,
      currentUsage: "8.4 GB",
      totalStorage: "50 GB",
      productId: null // System alert
    },
    {
      id: 7,
      type: "team",
      priority: "medium",
      title: "Document Approval Pending",
      description: "3 documents are awaiting your approval: DHF v2.3, Risk Assessment Matrix, CAPA-2025-001",
      date: "2 days ago",
      read: false,
      user: "John Doe",
      documentsCount: 3,
      productId: currentProject?.products[0]?.id
    },
    {
      id: 8,
      type: "regulatory",
      priority: "medium",
      title: "EU MDR Clinical Evaluation Guidance",
      description: "Updated guidance on clinical evaluation reports under EU MDR. New template requirements for post-market clinical follow-up.",
      date: "3 days ago",
      read: true,
      regulation: "EU MDR",
      impact: "Medium Impact",
      affectedItems: ["Clinical Evaluation Report", "PMCF Plan"],
      productId: currentProject?.products[1]?.id
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "regulatory":
        return <Shield className="text-purple-600" size={18} />;
      case "deadline":
        return <Clock className="text-orange-600" size={18} />;
      case "team":
        return <CheckCircle className="text-green-600" size={18} />;
      case "system":
        return <Info className="text-blue-600" size={18} />;
      default:
        return <Bell className="text-slate-400" size={18} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case "medium":
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case "low":
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  // Filter alerts by product, type, and optional regulation
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesProduct = !selectedProductId || !alert.productId || alert.productId === selectedProductId;
      const typeMap: { [key: string]: string } = {
        "Regulatory Updates": "regulatory",
        "Deadlines": "deadline",
        "Team Activity": "team",
        "System": "system",
      };
      const matchesType = selectedFilter === "All" ? true : alert.type === typeMap[selectedFilter];
      const matchesReg = !regulationFilter || (alert.regulation || "").toLowerCase().includes(regulationFilter.toLowerCase());
      return matchesProduct && matchesType && matchesReg;
    });
  }, [alerts, selectedFilter, selectedProductId, regulationFilter]);

  const unreadCount = filteredAlerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-[#064E3B]">Alerts & Updates</h1>
            <Badge variant="outline" className="border-slate-200 text-xs">
              {unreadCount} Unread
            </Badge>
          </div>
          <p className="text-slate-500 font-light">
            Monitor regulatory changes, deadlines, and system alerts.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <span className="text-xs text-slate-500">Regulation</span>
            <input
              value={regulationFilter || ""}
              onChange={(e) => setRegulationFilter(e.target.value || null)}
              className="text-sm outline-none"
              placeholder="e.g., EU MDR"
            />
            {regulationFilter && (
              <button onClick={() => setRegulationFilter(null)} className="text-slate-400 text-xs">Clear</button>
            )}
          </div>
          <Button variant="outline" className="border-slate-200">
            <Settings size={16} className="mr-2" /> Preferences
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter, i) => (
          <FadeIn key={filter.name} delay={i * 0.05}>
            <Button
              variant={selectedFilter === filter.name ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter.name)}
            >
              {filter.name}
              <Badge variant="outline" size="sm" className="ml-2">
                {filter.count}
              </Badge>
            </Button>
          </FadeIn>
        ))}
      </div>

      {/* Product Selector */}
      {currentProject && currentProject.products?.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Product:</span>
          <div className="flex gap-2 flex-wrap">
            {currentProject.products.map((product) => (
              <Button
                key={product.id}
                variant={selectedProductId === product.id ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedProductId(product.id)}
              >
                {product.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAlerts.map((alert, i) => (
          <ScrollReveal key={alert.id} delay={i * 0.05}>
            <Card className="p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#064E3B] flex items-center gap-2">
                      {alert.title}
                      {getPriorityBadge(alert.priority)}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3">{alert.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500 items-center">
                      {alert.regulation && <Badge variant="outline" size="sm">{alert.regulation}</Badge>}
                      {alert.impact && <Badge variant="outline" size="sm">{alert.impact}</Badge>}
                      <span>{alert.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!alert.read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#064E3B]">
                    <Eye size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
