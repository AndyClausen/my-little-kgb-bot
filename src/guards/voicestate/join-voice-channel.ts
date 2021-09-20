import { ArgsOf, GuardFunction } from '@typeit/discord';
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
    if (channel instanceof CategoryChannel && channel.children.has(after.channelID)) {
      if (!before || !channel.children.has(before.channelID)) {
        console.log(channel.type);
        console.log(channel.id);
        console.log(channel instanceof CategoryChannel);
        console.log(after.channel?.parent?.name);
        await next();
      }
    } else if (after.channelID === channelId) {
      if (!before || before.channelID !== channelId) {
        await next();
      }
    }
  };
}
