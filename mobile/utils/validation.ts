const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function getSignupValidationError(email: string, password: string, passwordConfirm: string) {
  if (!isValidEmail(email)) {
    return "올바른 이메일 형식을 입력해주세요.";
  }

  if (!isValidPassword(password)) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }

  if (password !== passwordConfirm) {
    return "비밀번호 확인이 일치하지 않습니다.";
  }

  return null;
}
