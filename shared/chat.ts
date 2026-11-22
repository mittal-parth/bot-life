export type ChatLine = {
  id: string;
  role: "user" | "bot";
  text: string;
  kind: "text" | "tool" | "card";
  web: boolean;
  at?: number;
  sendId?: string;
  requestId?: string;
  finishedAt?: number;
  failed?: boolean;
};
export type TownBot = {
  id: string;
  threadId: string;
  name: string;
  busy: boolean;
  messages: ChatLine[];
};
