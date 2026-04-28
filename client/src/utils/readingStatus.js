export const READING_STATUS_STYLE = {
  reading: {
    label: "읽는 중",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-50 text-blue-700",
    dot: "bg-blue-400",
  },
  want: {
    label: "읽고 싶음",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  done: {
    label: "완독",
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-50 text-green-700",
    dot: "bg-green-400",
  },
};

export function getReadingStatusStyle(status) {
  return READING_STATUS_STYLE[status] || READING_STATUS_STYLE.want;
}
