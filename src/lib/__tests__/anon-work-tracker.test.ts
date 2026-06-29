import { describe, test, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

beforeEach(() => {
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------
// setHasAnonWork
// ---------------------------------------------------------------------------

describe("setHasAnonWork", () => {
  test("persists data when messages are present", () => {
    const messages = [{ id: "1", role: "user", content: "hello" }];
    setHasAnonWork(messages, {});
    expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
  });

  test("persists data when the file system has more than just the root", () => {
    setHasAnonWork([], { "/": { type: "directory" }, "/App.jsx": { type: "file", content: "" } });
    expect(sessionStorage.getItem("uigen_has_anon_work")).toBe("true");
  });

  test("does not write to storage when both messages and FS are empty", () => {
    setHasAnonWork([], { "/": { type: "directory" } });
    expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
  });

  test("serializes messages and fileSystemData to the data key", () => {
    const messages = [{ id: "1", role: "user", content: "hi" }];
    const fileSystemData = { "/App.jsx": { type: "file", content: "x" } };
    setHasAnonWork(messages, fileSystemData);

    const raw = sessionStorage.getItem("uigen_anon_data");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.messages).toEqual(messages);
    expect(parsed.fileSystemData).toEqual(fileSystemData);
  });
});

// ---------------------------------------------------------------------------
// getHasAnonWork
// ---------------------------------------------------------------------------

describe("getHasAnonWork", () => {
  test("returns false when the key is not set", () => {
    expect(getHasAnonWork()).toBe(false);
  });

  test("returns true after setHasAnonWork has been called with content", () => {
    setHasAnonWork([{ id: "1", role: "user", content: "x" }], {});
    expect(getHasAnonWork()).toBe(true);
  });

  test("returns false when the value is not the string 'true'", () => {
    sessionStorage.setItem("uigen_has_anon_work", "1");
    expect(getHasAnonWork()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAnonWorkData
// ---------------------------------------------------------------------------

describe("getAnonWorkData", () => {
  test("returns null when no data is stored", () => {
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns the stored messages and fileSystemData", () => {
    const messages = [{ id: "2", role: "assistant", content: "done" }];
    const fsData = { "/index.js": { type: "file", content: "code" } };
    setHasAnonWork(messages, fsData);

    const data = getAnonWorkData();
    expect(data).not.toBeNull();
    expect(data!.messages).toEqual(messages);
    expect(data!.fileSystemData).toEqual(fsData);
  });

  test("returns null when the stored JSON is malformed", () => {
    sessionStorage.setItem("uigen_anon_data", "not-valid-json{{{");
    expect(getAnonWorkData()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearAnonWork
// ---------------------------------------------------------------------------

describe("clearAnonWork", () => {
  test("removes both storage keys", () => {
    setHasAnonWork([{ id: "1", role: "user", content: "x" }], {});
    expect(getHasAnonWork()).toBe(true);

    clearAnonWork();

    expect(sessionStorage.getItem("uigen_has_anon_work")).toBeNull();
    expect(sessionStorage.getItem("uigen_anon_data")).toBeNull();
  });

  test("is a no-op when nothing is stored", () => {
    expect(() => clearAnonWork()).not.toThrow();
  });

  test("getHasAnonWork returns false after clearing", () => {
    setHasAnonWork([{ id: "1", role: "user", content: "x" }], {});
    clearAnonWork();
    expect(getHasAnonWork()).toBe(false);
  });
});
