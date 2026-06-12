function isEmailInput(value) {
  return /[a-zA-Z@]/.test(value);
}

function formatUSPhoneInput(raw) {
  const digits = raw.replace(/\D/g, "");
  const normalized =
    digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  const d = normalized.slice(0, 10);

  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatCaregiverContactInput(value) {
  if (isEmailInput(value)) {
    return value.replace(/\s/g, "");
  }
  return formatUSPhoneInput(value);
}

function validateCaregiverContact(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: true, error: "", type: null };
  }

  if (trimmed.includes("@")) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(trimmed)) {
      return {
        valid: false,
        error: "Enter a valid email address (e.g. name@example.com)",
        type: "email",
      };
    }
    return { valid: true, error: "", type: "email" };
  }

  if (isEmailInput(trimmed)) {
    return {
      valid: false,
      error: "Enter a complete email address or a 10-digit US phone number",
      type: "email",
    };
  }

  const digits = trimmed.replace(/\D/g, "");
  const normalized =
    digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;

  if (normalized.length !== 10) {
    return {
      valid: false,
      error: "Enter a complete 10-digit US phone number",
      type: "phone",
    };
  }

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(normalized)) {
    return {
      valid: false,
      error: "Enter a valid US phone number",
      type: "phone",
    };
  }

  return { valid: true, error: "", type: "phone" };
}

function getCaregiverContactInputMode(value) {
  return isEmailInput(value) ? "email" : "tel";
}

Object.assign(window, {
  isEmailInput,
  formatUSPhoneInput,
  formatCaregiverContactInput,
  validateCaregiverContact,
  getCaregiverContactInputMode,
});
