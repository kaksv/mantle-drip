import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CreateStreamForm } from "@/components/create-stream-form";

export default function CreateStreamPage() {
  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-[1280px] py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/streams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Streams
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create Payment Stream</h1>
          <p className="text-muted-foreground">
            Set up a continuous payment stream to one or more recipients
          </p>
        </div>

        {/* Stream Creation Form */}
        <CreateStreamForm />
      </div>
    </main>
  );
}

