export const normalizeDate = (date: string | Date): Date => {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    return normalizedDate;
  };
  