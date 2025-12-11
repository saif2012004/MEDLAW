"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  Upload,
  Building2,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sendQuery, QueryResponse } from "@/lib/api";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isExpanded?: boolean;
  sources?: { chunk_id: string; text: string }[];
  attachments?: string[];
  isLoading?: boolean;
}

interface AttachedFile {
  file: File;
  id: string;
}

function AssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialQueryProcessed = useRef(false);

  const MAX_DISPLAY_LENGTH = 500;

  // Process initial query from URL on mount
  useEffect(() => {
    if (initialQueryProcessed.current) return;
    
    const query = searchParams.get("q");
    if (query) {
      initialQueryProcessed.current = true;
      processQuery(query);
    }
  }, [searchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const processQuery = async (query: string, files?: File[]) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: query,
      timestamp: new Date(),
      attachments: files?.map(f => f.name),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }]);

    setIsLoading(true);

    try {
      const response: QueryResponse = await sendQuery(query, files);

      // Check for redirect
      if (response.redirect) {
        router.push(response.redirect);
        return;
      }

      // Build assistant response
      const result = response.result;
      let content = result?.narrative || "I couldn't find relevant information for your query.";
      
      // Add checklist if present
      if (result?.checklist && result.checklist.length > 0) {
        content += "\n\n**Key Points:**\n";
        result.checklist.forEach((item, i) => {
          content += `${i + 1}. ${item}\n`;
        });
      }

      // Build sources from citations
      const sources = result?.citations 
        ? Object.entries(result.citations).map(([chunk_id, text]) => ({ chunk_id, text }))
        : [];

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId
          ? {
              ...msg,
              content,
              sources,
              isLoading: false,
              isExpanded: content.length <= MAX_DISPLAY_LENGTH,
            }
          : msg
      ));

      // Show follow-up options after first response
      setShowFollowUp(true);

    } catch (error: any) {
      console.error("Query error:", error);
      
      // Replace loading with error message
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId
          ? {
              ...msg,
              content: `I apologize, but I encountered an error processing your request: ${error.message}. Please try again.`,
              isLoading: false,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    
    const files = attachedFiles.map(f => f.file);
    
    // If files are attached but no query, use the last user query from chat history
    let queryToSend = inputValue.trim();
    if (!queryToSend && files.length > 0) {
      // Find the most recent user message with content
      const lastUserMessage = [...messages]
        .reverse()
        .find(m => m.type === "user" && m.content.trim());
      
      if (lastUserMessage) {
        queryToSend = lastUserMessage.content;
      } else {
        // No previous query, ask user to provide one
        queryToSend = "Please analyze the uploaded document(s)";
      }
    }
    
    processQuery(queryToSend, files.length > 0 ? files : undefined);
    
    setInputValue("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const newFiles: AttachedFile[] = [];
    
    Array.from(files).forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (allowedTypes.includes(ext)) {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    });
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const toggleExpand = (messageId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isExpanded: !msg.isExpanded } : msg
    ));
  };

  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#064E3B]" />
          <span className="text-slate-500">Analyzing your query...</span>
        </div>
      );
    }

    const content = message.content;
    const isLong = content.length > MAX_DISPLAY_LENGTH;
    const displayContent = message.isExpanded || !isLong
      ? content
      : content.substring(0, MAX_DISPLAY_LENGTH) + "...";

    return (
      <>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {displayContent}
        </div>
        
        {isLong && (
          <button
            onClick={() => toggleExpand(message.id)}
            className="mt-3 text-sm font-medium text-[#064E3B] hover:underline flex items-center gap-1"
          >
            {message.isExpanded ? (
              <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Read More <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, i) => (
                <Badge
                  key={i}
                  variant="info"
                  className="text-xs bg-blue-50 text-blue-600 border-blue-100"
                >
                  {source.chunk_id}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const followUpOptions = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Add more context with your documents",
      action: () => fileInputRef.current?.click(),
    },
    {
      icon: Building2,
      title: "Create Organization",
      description: "Set up compliance monitoring for your company",
      action: () => router.push("/onboarding"),
    },
    {
      icon: LayoutDashboard,
      title: "View Dashboard",
      description: "See your compliance overview",
      action: () => router.push("/dashboard"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-[#064E3B] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Search</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#064E3B] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[#064E3B]">AI Assistant</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Your conversation will appear here</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.type === "user"
                    ? "bg-[#064E3B] text-white rounded-2xl rounded-tr-sm"
                    : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm"
                } p-5`}
              >
                <div className="flex items-start gap-3">
                  {message.type === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#064E3B]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.attachments.map((file, i) => (
                          <Badge key={i} className="bg-white/20 text-white border-white/30">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {file}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {renderMessageContent(message)}
                  </div>
                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Follow-up Options */}
          {showFollowUp && !isLoading && messages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600 mb-4">
                Would you like to continue with any of these options?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {followUpOptions.map((option, i) => (
                  <button
                    key={i}
                    onClick={option.action}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-[#064E3B] hover:bg-[#064E3B]/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#064E3B]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#064E3B]/20 transition-colors">
                      <option.icon className="w-5 h-5 text-[#064E3B]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-[#064E3B]">
                        {option.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFiles.map(({ file, id }) => (
                <div
                  key={id}
                  className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm"
                >
                  <FileText className="w-4 h-4 text-[#064E3B]" />
                  <span className="text-slate-700 max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-3 rounded-xl text-slate-400 hover:text-[#064E3B] hover:bg-slate-100 transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              className="flex-1 resize-none outline-none text-base text-slate-700 placeholder:text-slate-400 min-h-[48px] max-h-[150px] py-3 px-4 rounded-xl border border-slate-200 focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B]"
              rows={1}
              disabled={isLoading}
            />

            <Button
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
              className="flex-shrink-0 h-12 w-12 rounded-xl bg-[#064E3B] hover:bg-[#064E3B]/90 text-white p-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-slate-400 mt-2 text-center">
            AI responses are for guidance only. Always verify with official regulatory sources.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#064E3B]" />
      </div>
    }>
      <AssistantContent />
    </Suspense>
  );
}



