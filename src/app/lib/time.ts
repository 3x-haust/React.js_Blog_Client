const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const formatElapsedTimeKo = (isoDate: string): string => {
  const targetTime = new Date(isoDate).getTime();
  if (Number.isNaN(targetTime)) {
    return '-';
  }

  const diffMs = Date.now() - targetTime;
  if (diffMs < MINUTE_MS) {
    return '방금 전';
  }

  if (diffMs < HOUR_MS) {
    return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  }

  if (diffMs < DAY_MS) {
    return `${Math.floor(diffMs / HOUR_MS)}시간 전`;
  }

  return `${Math.floor(diffMs / DAY_MS)}일 전`;
};
