/** Safe user-facing message from employee create/update API failures. */
export function employeeMutationErrorMessage(
  error: any,
  fallback = "Failed to update employee",
): string {
  const fieldErrors = error?.data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const emailMsgs = fieldErrors.email;
    if (Array.isArray(emailMsgs) && emailMsgs[0]) {
      return String(emailMsgs[0]);
    }
    const first = Object.values(fieldErrors).find(
      (msgs) => Array.isArray(msgs) && msgs.length > 0,
    );
    if (Array.isArray(first) && first[0]) {
      return String(first[0]);
    }
  }

  const message = String(error?.data?.message || error?.message || "").trim();
  if (!message) return fallback;
  if (/SQLSTATE|Undefined column|pgsql|stack trace|HTTP error! status/i.test(message)) {
    return fallback;
  }
  return message;
}

export function employeeEmailFieldError(error: any): string | null {
  const emailMsgs = error?.data?.errors?.email;
  if (Array.isArray(emailMsgs) && emailMsgs[0]) {
    return String(emailMsgs[0]);
  }
  const message = String(error?.data?.message || error?.message || "");
  if (/email/i.test(message) && /taken|already|another|conflict|former/i.test(message)) {
    return employeeMutationErrorMessage(error, message);
  }
  return null;
}
