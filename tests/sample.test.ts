import { ExportError } from "../src/utils/errors";

describe("ExportError", () => {
  it("should set the correct name and message", () => {
    const err = new ExportError("Test error");
    expect(err.name).toBe("ExportError");
    expect(err.message).toBe("Test error");
  });
});
