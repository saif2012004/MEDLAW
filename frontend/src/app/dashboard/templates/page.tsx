"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Star,
  Copy,
  CheckCircle,
  Shield,
  Activity,
  Target,
  FileCheck,
  AlertTriangle,
  Users,
  BookOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { useProject } from "@/context/ProjectContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function TemplatesPage() {
  const { currentProject } = useProject();
  const [selectedCategory, setSelectedCategory] = useState("All Templates");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const searchParams = useSearchParams();

  // Auto-select first product if available
  React.useEffect(() => {
    if (currentProject?.products.length && !selectedProductId) {
      setSelectedProductId(currentProject.products[0].id);
    }
  }, [currentProject, selectedProductId]);

  // Prefill search from classification routing
  useEffect(() => {
    const preset = searchParams.get("search");
    if (preset) {
      setSearchText(preset);
      setSelectedCategory("All Templates");
    }
  }, [searchParams]);

  const categories = [
    { name: "All Templates", icon: FileText, count: 48 },
    { name: "Design & Development", icon: Target, count: 12 },
    { name: "Risk Management", icon: AlertTriangle, count: 8 },
    { name: "SOPs", icon: Shield, count: 10 },
    { name: "CAPA", icon: Activity, count: 6 },
    { name: "Validation", icon: CheckCircle, count: 7 },
    { name: "Training", icon: Users, count: 5 },
  ];

  const templates = [
    {
      id: 1,
      name: "Design History File Template",
      description: "Complete DHF structure with all required sections per FDA 21 CFR 820.30",
      category: "Design & Development",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Advanced",
      downloads: 1240,
      format: "DOCX",
      pages: 45,
      featured: true,
    },
    {
      id: 2,
      name: "Risk Management Plan",
      description: "ISO 14971 compliant risk management plan template with FMEA worksheets",
      category: "Risk Management",
      regulations: ["ISO 14971", "EU MDR"],
      difficulty: "Intermediate",
      downloads: 892,
      format: "XLSX",
      pages: 12,
      featured: true,
    },
    {
      id: 3,
      name: "Document Control SOP",
      description: "Standard Operating Procedure for document control and management",
      category: "SOPs",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Basic",
      downloads: 756,
      format: "DOCX",
      pages: 8,
      featured: false,
    },
    {
      id: 4,
      name: "CAPA Request Form",
      description: "Corrective and Preventive Action request form with root cause analysis",
      category: "CAPA",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Basic",
      downloads: 643,
      format: "PDF",
      pages: 3,
      featured: false,
    },
    {
      id: 5,
      name: "Validation Protocol Template",
      description: "IQ/OQ/PQ validation protocol template for equipment and processes",
      category: "Validation",
      regulations: ["FDA 21 CFR 820", "EU GMP"],
      difficulty: "Advanced",
      downloads: 521,
      format: "DOCX",
      pages: 28,
      featured: true,
    },
    {
      id: 6,
      name: "Design Input Requirements",
      description: "Template for documenting design input requirements and specifications",
      category: "Design & Development",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Intermediate",
      downloads: 489,
      format: "XLSX",
      pages: 6,
      featured: false,
    },
    {
      id: 7,
      name: "Risk Assessment Matrix",
      description: "Pre-built risk assessment matrix with scoring criteria and heat map",
      category: "Risk Management",
      regulations: ["ISO 14971"],
      difficulty: "Basic",
      downloads: 778,
      format: "XLSX",
      pages: 4,
      featured: false,
    },
    {
      id: 8,
      name: "Training Record Template",
      description: "Employee training record form with competency assessment",
      category: "Training",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Basic",
      downloads: 412,
      format: "PDF",
      pages: 2,
      featured: false,
    },
    {
      id: 9,
      name: "Design Verification Plan",
      description: "Comprehensive template for design verification testing and documentation",
      category: "Design & Development",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Advanced",
      downloads: 567,
      format: "DOCX",
      pages: 32,
      featured: true,
    },
    {
      id: 10,
      name: "Quality Manual Template",
      description: "Complete ISO 13485 quality manual template with all required sections",
      category: "SOPs",
      regulations: ["ISO 13485"],
      difficulty: "Advanced",
      downloads: 834,
      format: "DOCX",
      pages: 68,
      featured: true,
    },
    {
      id: 11,
      name: "Supplier Evaluation Form",
      description: "Supplier audit and evaluation checklist with scoring system",
      category: "SOPs",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Intermediate",
      downloads: 391,
      format: "XLSX",
      pages: 5,
      featured: false,
    },
    {
      id: 12,
      name: "Change Control Form",
      description: "Engineering change order form with impact assessment",
      category: "SOPs",
      regulations: ["FDA 21 CFR 820", "ISO 13485"],
      difficulty: "Basic",
      downloads: 528,
      format: "PDF",
      pages: 4,
      featured: false,
    },
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = selectedCategory === "All Templates" || t.category === selectedCategory;
      const matchesSearch =
        !searchText ||
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.regulations.some((r) => r.toLowerCase().includes(searchText.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchText]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#064E3B]/5">
            <FileText className="text-[#064E3B]" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#064E3B]">Templates Library</h1>
            <p className="text-slate-500">Pre-built templates for faster compliance</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search templates or regulations..."
            className="min-w-[240px]"
          />
          <Button variant="outline" className="border-slate-200" onClick={() => setSearchText("")}>
            <Filter size={16} className="mr-2" />
            Clear
          </Button>
        </div>
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

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((category, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <Card
              onClick={() => setSelectedCategory(category.name)}
              className={`p-4 cursor-pointer transition-all border ${selectedCategory === category.name ? "border-[#064E3B] shadow-md" : "border-slate-200"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#064E3B]">
                  <category.icon size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#064E3B]">{category.name}</div>
                  <div className="text-xs text-slate-500">{category.count} items</div>
                </div>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, i) => (
          <ScrollReveal key={template.id} delay={i * 0.05}>
            <Card className="p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#064E3B]/5 flex items-center justify-center text-[#064E3B]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#064E3B] text-lg">{template.name}</h3>
                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                      <Badge size="sm" variant="outline">{template.category}</Badge>
                      {template.featured && (
                        <Badge size="sm" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <Star size={12} /> Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" size="sm">{template.format}</Badge>
              </div>

              <p className="text-sm text-slate-600 mb-3 line-clamp-3">{template.description}</p>

              <div className="flex gap-2 flex-wrap mb-3">
                {template.regulations.map((reg, idx) => (
                  <Badge key={idx} variant="outline" size="sm" className="text-xs">
                    {reg}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <div>{template.difficulty}</div>
                <div>{template.pages} pages</div>
                <div>{template.downloads} downloads</div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye size={14} className="mr-2" /> Preview
                </Button>
                <Button size="sm" className="flex-1 bg-[#064E3B] text-white">
                  <Download size={14} className="mr-2" /> Download
                </Button>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* Guidance */}
      <Card className="p-4 border border-dashed border-slate-200 bg-slate-50/50">
        <div className="flex items-start gap-3">
          <Sparkles className="text-[#064E3B]" size={18} />
          <div className="space-y-1">
            <p className="text-sm text-slate-700 font-semibold">Tip</p>
            <p className="text-sm text-slate-600">Use the search bar to auto-fill when routed from the assistant (e.g., "DHF template", "ISO 14971").</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
