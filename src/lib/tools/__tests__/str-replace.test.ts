import { describe, test, expect, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildStrReplaceTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildStrReplaceTool(fs);
});

// ---------------------------------------------------------------------------
// view
// ---------------------------------------------------------------------------

describe("view command", () => {
  test("returns file content with line numbers", async () => {
    fs.createFile("/hello.txt", "line one\nline two\nline three");
    const result = await tool.execute({ command: "view", path: "/hello.txt" });
    expect(result).toContain("1\tline one");
    expect(result).toContain("2\tline two");
    expect(result).toContain("3\tline three");
  });

  test("returns error for non-existent file", async () => {
    const result = await tool.execute({ command: "view", path: "/nope.txt" });
    expect(result).toContain("File not found");
  });

  test("lists directory contents", async () => {
    fs.createFile("/src/index.js", "");
    fs.createFile("/src/utils.js", "");
    const result = await tool.execute({ command: "view", path: "/src" });
    expect(result).toContain("[FILE] index.js");
    expect(result).toContain("[FILE] utils.js");
  });

  test("respects view_range to return a subset of lines", async () => {
    fs.createFile("/multi.txt", "a\nb\nc\nd\ne");
    const result = await tool.execute({
      command: "view",
      path: "/multi.txt",
      view_range: [2, 4],
    });
    expect(result).not.toContain("1\ta");
    expect(result).toContain("2\tb");
    expect(result).toContain("4\td");
    expect(result).not.toContain("5\te");
  });

  test("shows a single numbered line with empty content for an empty file", async () => {
    fs.createFile("/empty.txt", "");
    const result = await tool.execute({ command: "view", path: "/empty.txt" });
    // An empty file produces one line entry: "1\t"
    expect(result).toBe("1\t");
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe("create command", () => {
  test("creates a new file and returns a success message", async () => {
    const result = await tool.execute({
      command: "create",
      path: "/App.jsx",
      file_text: "export default function App() { return <div />; }",
    });
    expect(result).toContain("File created");
    expect(fs.exists("/App.jsx")).toBe(true);
    expect(fs.readFile("/App.jsx")).toContain("App");
  });

  test("creates parent directories automatically", async () => {
    const result = await tool.execute({
      command: "create",
      path: "/src/components/Button.jsx",
      file_text: "export const Button = () => <button />;",
    });
    expect(result).toContain("File created");
    expect(fs.exists("/src/components/Button.jsx")).toBe(true);
    expect(fs.exists("/src/components")).toBe(true);
    expect(fs.exists("/src")).toBe(true);
  });

  test("creates a file with empty content when file_text is omitted", async () => {
    await tool.execute({ command: "create", path: "/empty.js" });
    expect(fs.exists("/empty.js")).toBe(true);
    expect(fs.readFile("/empty.js")).toBe("");
  });

  test("returns an error when the file already exists", async () => {
    fs.createFile("/existing.txt", "original content");
    const result = await tool.execute({
      command: "create",
      path: "/existing.txt",
      file_text: "new content",
    });
    expect(result).toContain("Error");
    // Original content should be untouched
    expect(fs.readFile("/existing.txt")).toBe("original content");
  });
});

// ---------------------------------------------------------------------------
// str_replace
// ---------------------------------------------------------------------------

describe("str_replace command", () => {
  test("replaces a string in a file", async () => {
    fs.createFile("/greeting.txt", "Hello, world!");
    const result = await tool.execute({
      command: "str_replace",
      path: "/greeting.txt",
      old_str: "world",
      new_str: "universe",
    });
    expect(result).toContain("Replaced");
    expect(fs.readFile("/greeting.txt")).toBe("Hello, universe!");
  });

  test("replaces all occurrences when string appears multiple times", async () => {
    fs.createFile("/repeat.txt", "foo bar foo baz foo");
    const result = await tool.execute({
      command: "str_replace",
      path: "/repeat.txt",
      old_str: "foo",
      new_str: "qux",
    });
    expect(result).toContain("3 occurrence(s)");
    expect(fs.readFile("/repeat.txt")).toBe("qux bar qux baz qux");
  });

  test("returns an error when old_str is not found", async () => {
    fs.createFile("/file.txt", "some content");
    const result = await tool.execute({
      command: "str_replace",
      path: "/file.txt",
      old_str: "not present",
      new_str: "replacement",
    });
    expect(result).toContain("Error");
    expect(fs.readFile("/file.txt")).toBe("some content");
  });

  test("returns an error for a non-existent file", async () => {
    const result = await tool.execute({
      command: "str_replace",
      path: "/missing.txt",
      old_str: "x",
      new_str: "y",
    });
    expect(result).toContain("Error");
  });
});

// ---------------------------------------------------------------------------
// insert
// ---------------------------------------------------------------------------

describe("insert command", () => {
  test("inserts text at the given line", async () => {
    fs.createFile("/lines.txt", "first\nsecond\nthird");
    const result = await tool.execute({
      command: "insert",
      path: "/lines.txt",
      insert_line: 1,
      new_str: "inserted",
    });
    expect(result).toContain("Text inserted");
    const content = fs.readFile("/lines.txt");
    expect(content).toBe("first\ninserted\nsecond\nthird");
  });

  test("inserts at line 0 to prepend content", async () => {
    fs.createFile("/prepend.txt", "line1\nline2");
    await tool.execute({
      command: "insert",
      path: "/prepend.txt",
      insert_line: 0,
      new_str: "prepended",
    });
    expect(fs.readFile("/prepend.txt")).toBe("prepended\nline1\nline2");
  });

  test("returns an error for an invalid line number", async () => {
    fs.createFile("/short.txt", "only one line");
    const result = await tool.execute({
      command: "insert",
      path: "/short.txt",
      insert_line: 999,
      new_str: "text",
    });
    expect(result).toContain("Error");
    expect(fs.readFile("/short.txt")).toBe("only one line");
  });

  test("returns an error for a non-existent file", async () => {
    const result = await tool.execute({
      command: "insert",
      path: "/no-file.txt",
      insert_line: 0,
      new_str: "text",
    });
    expect(result).toContain("Error");
  });
});

// ---------------------------------------------------------------------------
// undo_edit
// ---------------------------------------------------------------------------

describe("undo_edit command", () => {
  test("returns an unsupported error", async () => {
    const result = await tool.execute({
      command: "undo_edit",
      path: "/any.txt",
    });
    expect(result).toContain("not supported");
  });
});
