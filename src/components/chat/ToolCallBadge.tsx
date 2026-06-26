"use client";

import { Loader2 } from "lucide-react";

function getFileName(path: unknown): string {
  if (typeof path !== "string" || !path) return "file";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function getToolCallLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const fileName = getFileName(args.path);
    switch (command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
        return `Editing ${fileName}`;
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      case "undo_edit":
        return `Reverting ${fileName}`;
      default:
        return `Editing ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string | undefined;
    const fileName = getFileName(args.path);
    switch (command) {
      case "rename": {
        const newFileName = getFileName(args.new_path);
        return `Renaming ${fileName} → ${newFileName}`;
      }
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  isDone: boolean;
}

export function ToolCallBadge({ toolName, args, isDone }: ToolCallBadgeProps) {
  const label = getToolCallLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
