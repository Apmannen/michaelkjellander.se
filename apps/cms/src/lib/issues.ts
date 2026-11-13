// Every site has one board, made up of columns with issues in them.

export type IssueColumn = {
  id: string;
  name: string;
  // The column's place on the board, from the left, starting at 0.
  position: number;
  created_at: string;
  updated_at: string;
};

export type Issue = {
  id: string;
  // Counted per site. Shown with the site's id as prefix, see formatIssueKey.
  number: number;
  column_id: string;
  // The issue's place in its column, from the top, starting at 0.
  position: number;
  title: string;
  // Plain text, may contain line breaks.
  text: string;
  created_at: string;
  updated_at: string;
};

export type IssueInput = Pick<Issue, 'title' | 'text'>;

// The site's columns and issues, both in position order.
export type Board = {
  columns: IssueColumn[];
  issues: Issue[];
};

// E.g. MK-22 for issue 22 of the site 'mk'.
export const formatIssueKey = (siteId: string, number: number) =>
  `${siteId.toUpperCase()}-${number}`;

// The issue number in a key from formatIssueKey, or undefined if the key
// isn't one of the site's. Case doesn't matter, so mk-22 works too.
export const parseIssueKey = (
  siteId: string,
  key: string,
): number | undefined => {
  const prefix = `${siteId.toUpperCase()}-`;
  const upper = key.toUpperCase();
  if (!upper.startsWith(prefix)) {
    return undefined;
  }
  const rest = upper.slice(prefix.length);
  if (!/^[1-9][0-9]*$/.test(rest)) {
    return undefined;
  }
  return Number(rest);
};

export const validateIssue = (input: IssueInput): string | undefined => {
  if (!input.title.trim()) {
    return 'Rubrik måste anges.';
  }
  return undefined;
};

export const validateColumnName = (name: string): string | undefined => {
  if (!name.trim()) {
    return 'Namn måste anges.';
  }
  return undefined;
};
