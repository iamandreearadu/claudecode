import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getToolCallLabel ---

test("getToolCallLabel: str_replace_editor create", () => {
  expect(
    getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })
  ).toBe("Creating App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(
    getToolCallLabel("str_replace_editor", {
      command: "str_replace",
      path: "/components/Button.jsx",
    })
  ).toBe("Editing Button.jsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(
    getToolCallLabel("str_replace_editor", {
      command: "insert",
      path: "/components/Button.jsx",
    })
  ).toBe("Editing Button.jsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(
    getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })
  ).toBe("Reading App.jsx");
});

test("getToolCallLabel: str_replace_editor undo_edit", () => {
  expect(
    getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })
  ).toBe("Reverting App.jsx");
});

test("getToolCallLabel: str_replace_editor unknown command falls back to editing", () => {
  expect(
    getToolCallLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" })
  ).toBe("Editing App.jsx");
});

test("getToolCallLabel: str_replace_editor extracts filename from nested path", () => {
  expect(
    getToolCallLabel("str_replace_editor", {
      command: "create",
      path: "/src/components/Card.tsx",
    })
  ).toBe("Creating Card.tsx");
});

test("getToolCallLabel: str_replace_editor missing path uses fallback", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create" })).toBe(
    "Creating file"
  );
});

test("getToolCallLabel: file_manager rename shows both filenames", () => {
  expect(
    getToolCallLabel("file_manager", {
      command: "rename",
      path: "/Foo.jsx",
      new_path: "/Bar.jsx",
    })
  ).toBe("Renaming Foo.jsx → Bar.jsx");
});

test("getToolCallLabel: file_manager rename extracts filenames from nested paths", () => {
  expect(
    getToolCallLabel("file_manager", {
      command: "rename",
      path: "/components/Old.jsx",
      new_path: "/components/New.jsx",
    })
  ).toBe("Renaming Old.jsx → New.jsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(
    getToolCallLabel("file_manager", {
      command: "delete",
      path: "/components/Foo.jsx",
    })
  ).toBe("Deleting Foo.jsx");
});

test("getToolCallLabel: file_manager missing new_path uses fallback", () => {
  expect(
    getToolCallLabel("file_manager", { command: "rename", path: "/Foo.jsx" })
  ).toBe("Renaming Foo.jsx → file");
});

test("getToolCallLabel: unknown tool returns tool name as fallback", () => {
  expect(
    getToolCallLabel("some_other_tool", { command: "do_something" })
  ).toBe("some_other_tool");
});

// --- ToolCallBadge component ---

test("ToolCallBadge renders label text", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolCallBadge shows green dot when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      isDone={true}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner when not done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      isDone={false}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge renders file_manager delete label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/components/OldComponent.jsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Deleting OldComponent.jsx")).toBeDefined();
});

test("ToolCallBadge renders file_manager rename label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/Old.jsx", new_path: "/New.jsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Renaming Old.jsx → New.jsx")).toBeDefined();
});
