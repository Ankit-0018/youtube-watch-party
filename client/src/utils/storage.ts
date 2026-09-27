const ROOM_USERS_KEY = "watch_party_room_users";

interface StoredUser {
  userId: string;
  username: string;
}

type StoredUsers = Record<string, StoredUser>;

function getStoredUsers(): StoredUsers {
  const stored = localStorage.getItem(ROOM_USERS_KEY);

  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function saveRoomUser(roomId: string, userId: string, username: string) {
  const users = getStoredUsers();

  users[roomId] = {
    userId,
    username,
  };

  localStorage.setItem(ROOM_USERS_KEY, JSON.stringify(users));
}

export function getRoomUser(roomId: string): StoredUser | null {
  const users = getStoredUsers();

  return users[roomId] ?? null;
}
