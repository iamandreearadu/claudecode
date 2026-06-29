import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MessageList } from "../MessageList";
import type { Message } from "ai";

vi.mock("../MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe("empty state", () => {
  test("shows heading and subtitle when no messages", () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText("Generate React components")).toBeDefined();
    expect(
      screen.getByText("Describe what you want to build and I'll create it for you")
    ).toBeDefined();
  });

  test("does not render any message bubbles when empty", () => {
    const { container } = render(<MessageList messages={[]} />);
    // The message scroll container is not mounted in the empty state
    expect(container.querySelector(".space-y-4")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Basic message rendering
// ---------------------------------------------------------------------------

describe("basic rendering", () => {
  test("renders a user message", () => {
    const messages: Message[] = [{ id: "1", role: "user", content: "Create a button" }];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Create a button")).toBeDefined();
  });

  test("renders an assistant message via MarkdownRenderer", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "Here is your button." },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Here is your button.")).toBeDefined();
  });

  test("renders multiple messages in order", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "First user" },
      { id: "2", role: "assistant", content: "First assistant" },
      { id: "3", role: "user", content: "Second user" },
      { id: "4", role: "assistant", content: "Second assistant" },
    ];

    const { container } = render(<MessageList messages={messages} />);
    const bubbles = container.querySelectorAll(".rounded-2xl");

    expect(bubbles).toHaveLength(4);
    expect(bubbles[0].textContent).toContain("First user");
    expect(bubbles[1].textContent).toContain("First assistant");
    expect(bubbles[2].textContent).toContain("Second user");
    expect(bubbles[3].textContent).toContain("Second assistant");
  });
});

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

describe("message bubble styling", () => {
  test("user bubbles have blue background and white text", () => {
    const messages: Message[] = [{ id: "1", role: "user", content: "Hi" }];
    render(<MessageList messages={messages} />);

    const bubble = screen.getByText("Hi").closest(".rounded-2xl");
    expect(bubble?.className).toContain("bg-blue-600");
    expect(bubble?.className).toContain("text-white");
  });

  test("assistant bubbles have white background and dark text", () => {
    const messages: Message[] = [{ id: "1", role: "assistant", content: "Hello" }];
    render(<MessageList messages={messages} />);

    const bubble = screen.getByText("Hello").closest(".rounded-2xl");
    expect(bubble?.className).toContain("bg-white");
    expect(bubble?.className).toContain("text-neutral-900");
  });
});

// ---------------------------------------------------------------------------
// Message parts
// ---------------------------------------------------------------------------

describe("message parts", () => {
  test("renders text parts", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [{ type: "text", text: "Part text content" }],
      },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Part text content")).toBeDefined();
  });

  test("renders tool-invocation parts via ToolCallBadge", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          { type: "text", text: "Building it..." },
          {
            type: "tool-invocation",
            toolInvocation: {
              toolCallId: "tc1",
              toolName: "str_replace_editor",
              args: { command: "create", path: "/App.jsx" },
              state: "result",
              result: "ok",
            },
          },
        ],
      },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Building it...")).toBeDefined();
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
  });

  test("renders reasoning parts with label", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          { type: "text", text: "My answer." },
          {
            type: "reasoning",
            reasoning: "Internal reasoning text",
            details: [],
          },
        ],
      },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Reasoning")).toBeDefined();
    expect(screen.getByText("Internal reasoning text")).toBeDefined();
  });

  test("step-start at index > 0 renders a divider", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          { type: "text", text: "Step 1 content" },
          { type: "step-start" },
          { type: "text", text: "Step 2 content" },
        ],
      },
    ];
    render(<MessageList messages={messages} />);

    expect(screen.getByText("Step 1 content")).toBeDefined();
    expect(screen.getByText("Step 2 content")).toBeDefined();

    const bubble = screen.getByText("Step 1 content").closest(".rounded-2xl");
    expect(bubble?.querySelector("hr")).toBeDefined();
  });

  test("step-start at index 0 renders nothing for that part", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [
          { type: "step-start" },
          { type: "text", text: "Only content" },
        ],
      },
    ];
    const { container } = render(<MessageList messages={messages} />);
    expect(container.querySelectorAll("hr")).toHaveLength(0);
  });

  test("falls back to content string when no parts", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "Fallback content" },
    ];
    render(<MessageList messages={messages} />);
    expect(screen.getByText("Fallback content")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe("loading state", () => {
  test("shows Generating… for last empty assistant message when loading", () => {
    const messages: Message[] = [{ id: "1", role: "assistant", content: "" }];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.getByText("Generating…")).toBeDefined();
  });

  test("shows Generating… inside parts path when assistant has empty parts array", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "", parts: [] },
    ];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.getByText("Generating…")).toBeDefined();
  });

  test("shows Generating… after parts content when last assistant message is loading", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        parts: [{ type: "text", text: "Some streamed text" }],
      },
    ];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.getByText("Some streamed text")).toBeDefined();
    expect(screen.getByText("Generating…")).toBeDefined();
  });

  test("does not show Generating… when isLoading is false", () => {
    const messages: Message[] = [{ id: "1", role: "assistant", content: "" }];
    render(<MessageList messages={messages} isLoading={false} />);
    expect(screen.queryByText("Generating…")).toBeNull();
  });

  test("does not show Generating… when assistant message has content", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "Already done." },
    ];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.getByText("Already done.")).toBeDefined();
    expect(screen.queryByText("Generating…")).toBeNull();
  });

  test("does not show Generating… when the last message is from user", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "First reply" },
      { id: "2", role: "user", content: "Follow-up question" },
    ];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.queryByText("Generating…")).toBeNull();
  });

  test("only shows one Generating… indicator even with multiple messages", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "" },
      { id: "2", role: "assistant", content: "" },
    ];
    render(<MessageList messages={messages} isLoading={true} />);
    expect(screen.getAllByText("Generating…")).toHaveLength(1);
  });
});
