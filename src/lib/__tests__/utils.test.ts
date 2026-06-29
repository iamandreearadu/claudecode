import { describe, test, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  test("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("ignores falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  test("supports conditional object syntax", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
    expect(cn({ active: false, disabled: true })).toBe("disabled");
  });

  test("resolves conflicting Tailwind classes (last wins)", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  test("merges Tailwind modifier variants correctly", () => {
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
  });

  test("keeps non-conflicting classes", () => {
    const result = cn("flex", "items-center", "bg-red-500");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("bg-red-500");
  });

  test("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  test("handles arrays of class names", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
