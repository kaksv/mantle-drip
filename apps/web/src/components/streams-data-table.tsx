"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { StreamAnalytics, StreamStatus } from "@/lib/utils/stream-analytics";
import { formatTokenAmount } from "@/lib/utils/format";
import { getTokenByAddress } from "@/lib/tokens/config";
import { useChainId } from "wagmi";

interface StreamsDataTableProps {
  streams: StreamAnalytics[];
  isLoading?: boolean;
}

type SortField = "streamId" | "title" | "status" | "token" | "deposit" | "recipients" | "startTime" | "endTime";
type SortDirection = "asc" | "desc";

export function StreamsDataTable({ streams, isLoading }: StreamsDataTableProps) {
  const router = useRouter();
  const chainId = useChainId();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tokenFilter, setTokenFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("streamId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique tokens for filter
  const uniqueTokens = useMemo(() => {
    const tokens = new Set<string>();
    streams.forEach((stream) => tokens.add(stream.token));
    return Array.from(tokens);
  }, [streams]);

  // Filter and sort streams
  const filteredAndSortedStreams = useMemo(() => {
    let filtered = streams;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (stream) =>
          stream.title.toLowerCase().includes(query) ||
          stream.streamId.toString().includes(query) ||
          stream.sender.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const status = Number(statusFilter) as StreamStatus;
      filtered = filtered.filter((stream) => stream.status === status);
    }

    // Apply token filter
    if (tokenFilter !== "all") {
      filtered = filtered.filter((stream) => stream.token === tokenFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "streamId":
          aValue = Number(a.streamId);
          bValue = Number(b.streamId);
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "token":
          aValue = a.tokenSymbol;
          bValue = b.tokenSymbol;
          break;
        case "deposit":
          aValue = Number(a.deposit);
          bValue = Number(b.deposit);
          break;
        case "recipients":
          aValue = a.totalRecipients;
          bValue = b.totalRecipients;
          break;
        case "startTime":
          aValue = Number(a.startTime);
          bValue = Number(b.startTime);
          break;
        case "endTime":
          aValue = Number(a.endTime);
          bValue = Number(b.endTime);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [streams, searchQuery, statusFilter, tokenFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStreams.length / itemsPerPage);
  const paginatedStreams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStreams.slice(start, start + itemsPerPage);
  }, [filteredAndSortedStreams, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: StreamStatus) => {
    const statusConfig = {
      [StreamStatus.Pending]: { label: "Pending", className: "bg-gray-500/20 text-gray-300" },
      [StreamStatus.Active]: { label: "Active", className: "bg-green-500/20 text-green-300" },
      [StreamStatus.Paused]: { label: "Paused", className: "bg-yellow-500/20 text-yellow-300" },
      [StreamStatus.Cancelled]: { label: "Cancelled", className: "bg-red-500/20 text-red-300" },
      [StreamStatus.Completed]: { label: "Completed", className: "bg-blue-500/20 text-blue-300" },
    };
    const config = statusConfig[status] || statusConfig[StreamStatus.Pending];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (timestamp: bigint) => {
    if (timestamp === 0n) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Streams Data</CardTitle>
          <CardDescription>Loading streams data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Streams Data</CardTitle>
        <CardDescription>
          Detailed view of all streams with sorting, filtering, and pagination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, ID, or sender..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={StreamStatus.Pending.toString()}>Pending</SelectItem>
              <SelectItem value={StreamStatus.Active.toString()}>Active</SelectItem>
              <SelectItem value={StreamStatus.Paused.toString()}>Paused</SelectItem>
              <SelectItem value={StreamStatus.Completed.toString()}>Completed</SelectItem>
              <SelectItem value={StreamStatus.Cancelled.toString()}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tokenFilter} onValueChange={(v) => {
            setTokenFilter(v);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              {uniqueTokens.map((token) => {
                const tokenInfo = getTokenByAddress(token as `0x${string}`, chainId);
                return (
                  <SelectItem key={token} value={token}>
                    {tokenInfo?.symbol || "Unknown"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("streamId")}
                  >
                    ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("title")}
                  >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("token")}
                  >
                    Token
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("deposit")}
                  >
                    Deposit
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => handleSort("recipients")}
                  >
                    Recipients
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStreams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No streams found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStreams.map((stream) => (
                  <TableRow key={stream.streamId.toString()}>
                    <TableCell className="font-mono text-xs">{stream.streamId.toString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{stream.title}</TableCell>
                    <TableCell>{getStatusBadge(stream.status)}</TableCell>
                    <TableCell>{stream.tokenSymbol}</TableCell>
                    <TableCell className="text-right font-medium">
                      {stream.depositFormatted} {stream.tokenSymbol}
                    </TableCell>
                    <TableCell className="text-center">{stream.totalRecipients}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(stream.startTime)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(stream.endTime)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/streams/${stream.streamId}`)}
                        className="h-8"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedStreams.length)} of{" "}
              {filteredAndSortedStreams.length} streams
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





