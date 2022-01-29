import { ArgsOf, GuardFunction } from 'discordx';
import { CategoryChannel, VoiceState } from 'discord.js';

import GuardCache from '../../types/GuardCache';

export function JoinVoiceChannel(
  idOrFunc: string | ((voiceState: VoiceState, cache: GuardCache) => string)
): GuardFunction<ArgsOf<'voiceStateUpdate'>, GuardCache> {
  return async ([before, after], client, next, cache) => {
    if (!after) {
      return;
    }
    const channelId = typeof idOrFunc === 'string' ? idOrFunc : idOrFunc(after, cache);
    if (!channelId) {
      return;
    }
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return;
    }
    if (channel instanceof CategoryChannel && channel.children.has(after.channelId)) {
      if (!before || !channel.children.has(before.channelId)) {
        await next();
      }
    } else if (after.channelId === channelId) {
      if (!before || before.channelId !== channelId) {
        await next();
      }
    }
  };
}
