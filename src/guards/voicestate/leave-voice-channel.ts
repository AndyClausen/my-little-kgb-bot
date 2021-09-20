import { ArgsOf, GuardFunction } from '@typeit/discord';
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
    if (channel instanceof CategoryChannel && channel.children.has(before.channelID)) {
      if (!after || !channel.children.has(after.channelID)) {
        console.log(channel.type);
        console.log(channel.id);
        console.log(channel instanceof CategoryChannel);
        console.log(before.channel?.parent?.name);
        await next();
      }
    } else if (before.channelID === channelId) {
      if (!after || after.channelID !== channelId) {
        await next();
      }
    }
  };
}
