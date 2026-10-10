"use client";

import { useState } from "react";
import { SalesHeader, VoiceSaleButton } from "@/components/sales/SalesHeader";
import { SalesTable } from "@/components/sales/SalesTable";

export default function SalesPage() {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <div className="space-y-6">
      <SalesHeader voiceOpen={voiceOpen} onVoiceOpenChange={setVoiceOpen} />
      <SalesTable maxItems={50} emptyAction={<VoiceSaleButton onClick={() => setVoiceOpen(true)} />} />
    </div>
  );
}
