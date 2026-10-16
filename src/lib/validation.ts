export function requiredText(value: string, message: string, min = 2) {
  const text = value.trim();
  if (!text) return "";
  if (text.length < min) return message;
  return "";
}

export function isFilledText(value: string, min = 2) {
  return value.trim().length >= min;
}

export function yearMessage(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (!/^\d{4}$/.test(text)) return "Enter a four-digit year.";
  const year = Number(text);
  if (year < 1920 || year > 2015) return "Enter a year from 1920 to 2015.";
  return "";
}

export function isYear(value: string) {
  return value.trim().length > 0 && yearMessage(value) === "";
}

export function phoneMessage(value: string) {
  const text = value.trim();
  if (!text) return "";
  const digits = text.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) {
    return "Enter a phone number with 10 or 11 digits.";
  }
  return "";
}

export function isPhone(value: string) {
  return value.trim().length > 0 && phoneMessage(value) === "";
}

export function yearsMessage(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (!/^\d{1,2}$/.test(text) || Number(text) > 80) {
    return "Enter the years fishing, from 0 to 80.";
  }
  return "";
}

export function isYears(value: string) {
  return value.trim().length > 0 && yearsMessage(value) === "";
}

export function ninMessage(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (!/^\d{11}$/.test(text)) return "NIN is 11 digits.";
  return "";
}

export function blueIdMessage(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (!/^(CRS-BLU-[A-Z]{3}-\d{4}|TMP-[A-Z]{3}-\d{4})$/i.test(text)) {
    return "Enter a Blue ID such as CRS-BLU-BAK-0142.";
  }
  return "";
}

export function isBlueId(value: string) {
  return value.trim().length > 0 && blueIdMessage(value) === "";
}
