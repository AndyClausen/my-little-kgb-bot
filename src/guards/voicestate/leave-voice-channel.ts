import { ArgsOf, GuardFunction } from 'discordx';
import { CategoryChannel, VoiceState } from 'discord.js';
import GuardCache from '../../types/GuardCache';

export function LeaveVoiceChannel(
  idOrFunc: string | ((voiceState: VoiceState, cache: GuardCache) => string)
): GuardFunction<ArgsOf<'voiceStateUpdate'>, GuardCache> {
  return async ([before, after], client, next, cache) => {
    if (!before) {
      return;
    }
    const channelId = typeof idOrFunc === 'string' ? idOrFunc : idOrFunc(before, cache);
    if (!channelId) {
      return;
    }
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return;
    }
    if (channel instanceof CategoryChannel && channel.children.has(before.channelId)) {
      if (!after || !channel.children.has(after.channelId)) {
        await next();
      }
    } else if (before.channelId === channelId) {
      if (!after || after.channelId !== channelId) {
        await next();
      }
    }
  };
}
