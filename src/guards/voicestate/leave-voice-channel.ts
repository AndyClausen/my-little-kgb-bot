import { ArgsOf, GuardFunction } from '@typeit/discord';
import { VoiceState } from 'discord.js';
import GuardCache from '../../types/GuardCache';

export function LeaveVoiceChannel(
  channel: string | ((voiceState: VoiceState, cache: GuardCache) => string)
): GuardFunction<ArgsOf<'voiceStateUpdate'>, GuardCache> {
  return async ([before, after], client, next, cache) => {
    if (!before) {
      return;
    }
    const channelId = typeof channel === 'string' ? channel : channel(before, cache);
    if (!channelId) {
      return;
    }
    if (before.channelID === channelId) {
      if (!after || after.channelID !== channelId) {
        await next();
      }
    }
  };
}
