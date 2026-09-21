import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Panel - Form Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:flex-none lg:w-1/2 xl:w-5/12 2xl:w-1/3">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right Panel - Graphic Area */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-red-600 via-red-500 to-rose-700 items-center justify-center p-12">
        <div className="relative z-10 text-center text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Powerful CRM Solutions</h2>
          <p className="text-lg text-white/90 leading-relaxed">
            Manage your leads, track conversions, and analyze website performance all from one unified dashboard. Designed specifically for digital agencies.
          </p>
          <div className="mt-12 flex justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-white/40"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-white/40"></div>
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-black/10 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
