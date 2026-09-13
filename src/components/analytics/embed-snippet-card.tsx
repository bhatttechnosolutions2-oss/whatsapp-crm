"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Check, Sparkles, ExternalLink } from "lucide-react";

interface EmbedSnippetCardProps {
  orgSlug: string;
}

export function EmbedSnippetCard({ orgSlug }: EmbedSnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-crm-domain.com";

  const snippetCode = `<script src="${origin}/api/v1/analytics/script.js?org=${orgSlug}" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Install Website Tracking Pixel
                <Badge variant="default" className="text-[10px] bg-blue-100 text-blue-700">
                  &lt;2KB Lightweight
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Paste this script into the <code>&lt;head&gt;</code> of your website to start capturing live visitors, WhatsApp conversions, and traffic funnels automatically.
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={handleCopy}
            size="sm"
            className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied to Clipboard!" : "Copy Code Snippet"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        <div className="relative rounded-xl bg-slate-900 p-4 font-mono text-xs text-blue-300 overflow-x-auto shadow-inner">
          <pre>{snippetCode}</pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Zero dependencies, zero slowdown
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Auto-tracks WhatsApp & Form clicks
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Compatible with WordPress, Shopify, Next.js
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
