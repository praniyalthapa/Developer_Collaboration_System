// Tracks which conversation is currently open so global message
// notifications can skip the chat the user is already looking at.
let activeChatUserId: string | null = null;

export const setActiveChat = (userId: string | null): void => {
  activeChatUserId = userId;
};

export const getActiveChat = (): string | null => activeChatUserId;
