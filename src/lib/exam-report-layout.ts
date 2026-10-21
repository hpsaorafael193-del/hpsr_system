export const EXAM_REPORT_BODY_TOP = 214;
export const EXAM_SIGNED_BODY_HEIGHT = 714;
export const EXAM_UNSIGNED_BODY_HEIGHT = 834;
export const EXAM_SECTION_GAP = 12;

export function lastReportPageIndex(pages: Array<{ type: string }>): number {
  for (let index = pages.length - 1; index >= 0; index--) if (pages[index].type === "report") return index;
  return -1;
}
