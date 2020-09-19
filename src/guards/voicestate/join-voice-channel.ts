import { GuardFunction } from "@typeit/discord";
import { VoiceState } from "discord.js";

import GuardCache from "../../types/GuardCache";

export function JoinVoiceChannel(
  channel: string | ((voiceState: VoiceState, cache: GuardCache) => string)
): GuardFunction<'voiceStateUpdate', GuardCache> {
  return async ([before, after], client, next, cache) => {
    if (!after) {
      return;
    }
    const channelId = typeof channel === 'string' ? channel : channel(after, cache);
    if (!channelId) {
      return;
    }
    if (after.channelID === channelId) {
      if (!before || before.channelID !== channelId) {
        await next();
      }
    }
  };
}
