import {
  getSignupValidationError,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "../../utils/validation";

describe("validation utils", () => {
  it("normalizes email by trimming and lowercasing", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("accepts a valid email", () => {
    expect(isValidEmail("tester@example.com")).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(isValidEmail("tester-example.com")).toBe(false);
  });

  it("accepts passwords with at least 6 characters", () => {
    expect(isValidPassword("secret")).toBe(true);
  });

  it("rejects passwords shorter than 6 characters", () => {
    expect(isValidPassword("12345")).toBe(false);
  });

  it("returns an email error for invalid signup data", () => {
    expect(getSignupValidationError("wrong-email", "secret1", "secret1")).toBe(
      "올바른 이메일 형식을 입력해주세요."
    );
  });

  it("returns a password mismatch error", () => {
    expect(getSignupValidationError("tester@example.com", "secret1", "secret2")).toBe(
      "비밀번호 확인이 일치하지 않습니다."
    );
  });

  it("returns null for valid signup data", () => {
    expect(getSignupValidationError("tester@example.com", "secret1", "secret1")).toBeNull();
  });
});
