"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StreamDetailsView } from "@/components/stream-details-view";

export default function StreamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params?.id ? BigInt(params.id as string) : undefined;

  if (!streamId) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Invalid stream ID</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/streams">Back to Streams</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/streams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Streams
            </Link>
          </Button>
        </div>

        <StreamDetailsView streamId={streamId} />
      </div>
    </main>
  );
}

