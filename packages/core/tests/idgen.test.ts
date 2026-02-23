import { describe, it, expect } from "vitest";
import { generateNextId } from "../src/idgen.js";

describe("generateNextId", () => {
  it("ilk karar D001 olur", () => {
    expect(generateNextId(0)).toBe("D001");
  });

  it("9. karar D009 olur", () => {
    expect(generateNextId(8)).toBe("D009");
  });

  it("99. karar D099 olur", () => {
    expect(generateNextId(98)).toBe("D099");
  });

  it("999. karar D999 olur", () => {
    expect(generateNextId(998)).toBe("D999");
  });

  it("1000. karar 4 haneli formata geçer", () => {
    const id = generateNextId(999);
    expect(id).toMatch(/^D.{4}$/);
  });
});
