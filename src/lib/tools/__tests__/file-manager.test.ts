import { describe, test, expect, beforeEach, vi } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";

// Unwrap the `tool()` helper so we can access the execute function directly.
vi.mock("ai", () => ({
  tool: (config: unknown) => config,
}));

import { buildFileManagerTool } from "@/lib/tools/file-manager";

let fs: VirtualFileSystem;
let execute: (args: { command: string; path: string; new_path?: string }) => Promise<unknown>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  const t = buildFileManagerTool(fs) as {
    execute: typeof execute;
  };
  execute = t.execute;
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

describe("rename command", () => {
  test("renames a file successfully", async () => {
    fs.createFile("/old.txt", "content");
    const result = await execute({ command: "rename", path: "/old.txt", new_path: "/new.txt" });
    expect((result as { success: boolean }).success).toBe(true);
    expect(fs.exists("/new.txt")).toBe(true);
    expect(fs.exists("/old.txt")).toBe(false);
  });

  test("preserves file content after rename", async () => {
    fs.createFile("/source.js", "const x = 1;");
    await execute({ command: "rename", path: "/source.js", new_path: "/dest.js" });
    expect(fs.readFile("/dest.js")).toBe("const x = 1;");
  });

  test("creates destination directories when they do not exist", async () => {
    fs.createFile("/root.ts", "export {}");
    const result = await execute({
      command: "rename",
      path: "/root.ts",
      new_path: "/src/lib/root.ts",
    });
    expect((result as { success: boolean }).success).toBe(true);
    expect(fs.exists("/src/lib/root.ts")).toBe(true);
    expect(fs.exists("/src/lib")).toBe(true);
  });

  test("returns an error when new_path is omitted", async () => {
    fs.createFile("/file.txt", "");
    const result = await execute({ command: "rename", path: "/file.txt" });
    expect((result as { success: boolean }).success).toBe(false);
    expect((result as { error: string }).error).toMatch(/new_path/i);
  });

  test("returns an error when source path does not exist", async () => {
    const result = await execute({
      command: "rename",
      path: "/nonexistent.txt",
      new_path: "/anywhere.txt",
    });
    expect((result as { success: boolean }).success).toBe(false);
  });

  test("returns an error when destination already exists", async () => {
    fs.createFile("/a.txt", "a");
    fs.createFile("/b.txt", "b");
    const result = await execute({ command: "rename", path: "/a.txt", new_path: "/b.txt" });
    expect((result as { success: boolean }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe("delete command", () => {
  test("deletes a file successfully", async () => {
    fs.createFile("/to-delete.txt", "bye");
    const result = await execute({ command: "delete", path: "/to-delete.txt" });
    expect((result as { success: boolean }).success).toBe(true);
    expect(fs.exists("/to-delete.txt")).toBe(false);
  });

  test("returns an error when file does not exist", async () => {
    const result = await execute({ command: "delete", path: "/ghost.txt" });
    expect((result as { success: boolean }).success).toBe(false);
  });

  test("deletes a directory and its children", async () => {
    fs.createFile("/dir/child.txt", "child");
    const result = await execute({ command: "delete", path: "/dir" });
    expect((result as { success: boolean }).success).toBe(true);
    expect(fs.exists("/dir")).toBe(false);
    expect(fs.exists("/dir/child.txt")).toBe(false);
  });
});
