/**
 * CSV Export Utilities
 * Core functions for generating and downloading CSV files
 */

/**
 * Escape special characters in CSV values
 * Handles commas, quotes, and newlines
 * @param value - Value to escape
 * @returns Escaped string safe for CSV
 */
export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert an array of objects to CSV string
 * @param data - Array of objects to convert
 * @param headers - Array of header names (keys to extract from objects)
 * @returns CSV formatted string
 */
export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.map(escapeCSVValue).join(",") + "\n";
  }

  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCSVValue(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Convert key-value pairs to CSV format (two columns)
 * @param data - Object with key-value pairs
 * @returns CSV formatted string with Key,Value columns
 */
export function convertKeyValueToCSV(data: Record<string, any>): string {
  const headers = ["Key", "Value"];
  const rows = Object.entries(data).map(([key, value]) => ({
    Key: key,
    Value: value,
  }));

  return convertToCSV(rows, headers);
}

/**
 * Format Unix timestamp to readable date string
 * @param timestamp - Unix timestamp in seconds
 * @param format - Format style: 'iso' | 'readable' | 'date-only'
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number,
  format: "iso" | "readable" | "date-only" = "readable"
): string {
  if (!timestamp || timestamp === 0) {
    return "Never";
  }

  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  switch (format) {
    case "iso":
      return date.toISOString();
    case "date-only":
      return date.toLocaleDateString();
    case "readable":
    default:
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
  }
}

/**
 * Format address for CSV export
 * @param address - Ethereum address
 * @param format - 'full' for complete address, 'truncated' for shortened version
 * @returns Formatted address string
 */
export function formatAddress(address: string, format: "full" | "truncated" = "full"): string {
  if (!address) {
    return "";
  }

  if (format === "truncated") {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2 days 3 hours")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return "0 seconds";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0 && days === 0) {
    // Only show minutes if less than a day
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  if (secs > 0 && days === 0 && hours === 0) {
    // Only show seconds if less than an hour
    parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`);
  }

  return parts.join(" ") || "0 seconds";
}

/**
 * Download CSV content as a file
 * @param csvContent - CSV string content
 * @param filename - Filename for the downloaded file (without .csv extension)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Ensure filename ends with .csv
  const fullFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fullFilename);
  link.style.visibility = "hidden";

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Combine multiple CSV sections into one CSV file
 * @param sections - Array of CSV sections (each with optional title and content)
 * @returns Combined CSV string
 */
export function combineCSVSections(
  sections: Array<{ title?: string; content: string }>
): string {
  const combined: string[] = [];

  sections.forEach((section, index) => {
    // Add section title if provided
    if (section.title) {
      combined.push(`\n${section.title}`);
    }

    // Add section content
    combined.push(section.content);

    // Add spacing between sections (except after last section)
    if (index < sections.length - 1) {
      combined.push(""); // Empty line for spacing
    }
  });

  return combined.join("\n");
}





