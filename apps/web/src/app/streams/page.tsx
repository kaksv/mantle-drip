"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StreamsDashboard } from "@/components/streams-dashboard";

export default function StreamsPage() {
  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-[1280px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payment Streams</h1>
            <p className="text-muted-foreground">
              Manage your active payment streams and create new ones
            </p>
          </div>
          <Button asChild>
            <Link href="/streams/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Stream
            </Link>
          </Button>
        </div>

        {/* Streams Dashboard */}
        <StreamsDashboard />
      </div>
    </main>
  );
}

