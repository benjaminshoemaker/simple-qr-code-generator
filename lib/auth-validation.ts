export type SignupValidationErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

interface SignupValidationInput {
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateSignupForm({
  email,
  password,
  confirmPassword,
}: SignupValidationInput): SignupValidationErrors {
  const errors: SignupValidationErrors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must contain at least one uppercase letter";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Password must contain at least one lowercase letter";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one number";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}
