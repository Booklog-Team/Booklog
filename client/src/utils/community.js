export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function deadlineToMillis(deadline) {
  if (!deadline) return Number.POSITIVE_INFINITY;

  const value = String(deadline).trim();
  if (!value) return Number.POSITIVE_INFINITY;

  const hasTime = value.includes("T") || value.includes(" ");
  const time = new Date(hasTime ? value : `${value}T23:59:59`).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function isDeadlineActive(deadline, now = Date.now()) {
  return deadlineToMillis(deadline) >= now;
}

export function getMeetingStatus(meeting, uid, now = Date.now()) {
  const members = Array.isArray(meeting.members) ? meeting.members : [];
  const maxMembers = Number(meeting.maxMembers) || 10;
  const memberCount = members.length;
  const isJoined = Boolean(uid && members.includes(uid));
  const isFull = memberCount >= maxMembers;
  const isRecruiting = !isFull && isDeadlineActive(meeting.deadline, now);

  return {
    memberCount,
    maxMembers,
    isJoined,
    isFull,
    isRecruiting,
    isClosed: !isRecruiting,
    statusKey: isJoined ? "joined" : isRecruiting ? "recruiting" : "closed",
  };
}

export function sortMeetings(meetings, sortBy, now = Date.now()) {
  const sorted = [...meetings];

  if (sortBy === "deadline") {
    return sorted.sort((a, b) => {
      const aRecruiting = getMeetingStatus(a, null, now).isRecruiting ? 0 : 1;
      const bRecruiting = getMeetingStatus(b, null, now).isRecruiting ? 0 : 1;
      return (
        aRecruiting - bRecruiting ||
        deadlineToMillis(a.deadline) - deadlineToMillis(b.deadline) ||
        toMillis(b.createdAt) - toMillis(a.createdAt)
      );
    });
  }

  if (sortBy === "popular") {
    return sorted.sort((a, b) => {
      const aMembers = Array.isArray(a.members) ? a.members.length : 0;
      const bMembers = Array.isArray(b.members) ? b.members.length : 0;
      return bMembers - aMembers || toMillis(b.createdAt) - toMillis(a.createdAt);
    });
  }

  return sorted.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export function sortPosts(posts, sortBy) {
  const sorted = [...posts];

  if (sortBy === "likes") {
    return sorted.sort((a, b) => {
      const aLikes = Array.isArray(a.likes) ? a.likes.length : 0;
      const bLikes = Array.isArray(b.likes) ? b.likes.length : 0;
      return bLikes - aLikes || toMillis(b.createdAt) - toMillis(a.createdAt);
    });
  }

  return sorted.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}
