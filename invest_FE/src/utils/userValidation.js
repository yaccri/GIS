// src/utils/userValidation.js
export const validateName = (value) => {
  const nameRegex = /^[A-Za-zא-ת\s-]+$/;
  if (!nameRegex.test(value)) {
    return 'Name must contain only letters, spaces, and hyphens (A-Z, a-z, א-ת, -, space).';
  }
  return null;
};

export const validateDOB = (value) => {
  if (value) {
    const dob = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 0) {
      return 'Are you coming from the future? :)\nTime travelers are not allowed.';
    }
    if (age < 18) {
      return 'You must be at least 18 years old to subscribe.';
    }
    if (age > 120) {
      return 'The date of birth seems to be incorrect.';
    }
  }
  return null;
};

export const validatePassword = (value) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (value && !passwordRegex.test(value)) {
    return 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.';
  }
  return null;
};

export const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value && !emailRegex.test(value)) {
    return 'Please enter a valid email address (e.g., example@domain.com).';
  }
  return null;
};

export const validateUsername = (value) => {
  if (value.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  return null;
};
