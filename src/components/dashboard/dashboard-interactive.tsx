"use client";

import React, { useState } from "react";

export function InstallAppButton() {
  const handleInstall = () => {
    // PWA install prompt
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      alert("To install the app, tap the Share button in your browser and select 'Add to Home Screen'.");
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
    >
      ↓ Install App
    </button>
  );
}

export function FeatureRequestBox() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    // In a real app, this would send to an API
    setSent(true);
    setTimeout(() => { setSent(false); setText(""); }, 3000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <p className="text-sm font-semibold text-gray-800 mb-1">💡 Request a New Feature</p>
      <p className="text-xs text-gray-500 mb-3">
        Have an idea or something you&apos;d like added to your CRM? Tell us — our team reviews every request.
      </p>
      {sent ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <span className="text-green-600 text-sm font-medium">✓ Request sent! Thank you.</span>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white resize-none"
            rows={2}
            placeholder="Describe the feature you'd like to see..."
          />
          <button
            onClick={handleSubmit}
            className="mt-2 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Send Request
          </button>
        </>
      )}
    </div>
  );
}
