"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkStreamCreation } from "@/components/bulk-stream-creation";
import { BatchSubscriptionManagement } from "@/components/batch-subscription-management";
import { ExportData } from "@/components/export-data";
import { TreasuryActivityLog } from "@/components/treasury-activity-log";
import { BudgetControls } from "@/components/budget-controls";

export function TreasuryTabs() {
  return (
    <Tabs defaultValue="bulk-streams" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="bulk-streams">Bulk Streams</TabsTrigger>
        <TabsTrigger value="batch-subs">Batch Subs</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="budget">Budget</TabsTrigger>
      </TabsList>
      
      <TabsContent value="bulk-streams" className="mt-6">
        <BulkStreamCreation />
      </TabsContent>
      
      <TabsContent value="batch-subs" className="mt-6">
        <BatchSubscriptionManagement />
      </TabsContent>
      
      <TabsContent value="export" className="mt-6">
        <ExportData />
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <TreasuryActivityLog />
      </TabsContent>
      
      <TabsContent value="budget" className="mt-6">
        <BudgetControls />
      </TabsContent>
    </Tabs>
  );
}

