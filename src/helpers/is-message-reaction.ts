import { MessageReaction } from "discord.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export default function isMessageReaction(obj: unknown): obj is MessageReaction {
  if (typeof obj === 'object' && obj) {
    if ('message' in obj && 'emoji' in obj) {
      return true;
    }
  }
  return false;
}
