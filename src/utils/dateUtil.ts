/** Date -> "yyyy-MM-dd" (저장/전달용 포맷) */
export const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** "yyyy-MM-dd" -> Date. 값이 없거나 형식이 잘못되면 null */
export const parseISODate = (value?: string): Date | null => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** 생년월일로 만 나이 계산 */
export const calculateAge = (birthDate: Date, today = new Date()): number => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

/** 연도를 뺀 생일 표기 ("9월 18일") */
export const formatBirthday = (date: Date): string =>
  date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
