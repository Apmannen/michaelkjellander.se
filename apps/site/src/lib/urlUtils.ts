const isExternalLink = (href: string) => {
  return href.startsWith('https://') || href.startsWith('http://');
};

export const urlUtils = { isExternalLink };
