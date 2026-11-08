const dateFormat = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDate = (isoDate: string) => {
  return dateFormat.format(new Date(isoDate));
};
