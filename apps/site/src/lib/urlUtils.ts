const isExternalLink = (href: string) => {
  return !href.startsWith('/');
};

export const urlUtils = { isExternalLink };
