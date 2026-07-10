/**
 * Centralized profile constants for Alumni Hub.
 * Single source of truth — import from here in all pages.
 */

/** Auto-generated admission batch years (class of 2010 → 2030) */
export const BATCH_OPTIONS: string[] = Array.from(
  { length: 21 },
  (_, i) => String(2010 + i)
);

/** All departments available at Vasavi College */
export const DEPARTMENT_OPTIONS: string[] = [
  "CSE",
  "CST",
  "ECE",
  "ECT",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIML",
  "CAI",
];

/**
 * Section mapping by department.
 * CST and ECT are full-batch departments with no sections.
 * AIML and CAI are newer departments also treated as full-batch.
 */
export const SECTION_MAPPING: Record<string, string[]> = {
  CSE: ["A", "B", "C"],
  ECE: ["A", "B", "C"],
  IT:  ["A", "B", "C"],
  EEE: ["A", "B"],
  MECH: ["A", "B"],
  CIVIL: ["A", "B"],
  CST:  [],
  ECT:  [],
  AIML: [],
  CAI:  [],
};

/**
 * Returns the section options for a given department.
 * Returns an empty array for full-batch departments (CST, ECT, AIML, CAI).
 */
export function getSectionsForDepartment(department: string): string[] {
  return SECTION_MAPPING[department] ?? [];
}

/**
 * Human-readable tooltip for the "Admission Batch" field.
 * This is the 4-digit year the student was ADMITTED to the college,
 * not the graduation year.
 */
export const ADMISSION_BATCH_TOOLTIP =
  "Your admission year — the year you joined Vasavi College (e.g., 2022 for the 2022–2026 batch).";
