import { ArgsOf, GuardFunction } from 'discordx';
import { Events } from 'discord.js';

export function IsInChannel(channelId: string): GuardFunction<ArgsOf<Events.MessageCreate>> {
  return async ([message], client, next) => {
    if (message.channel.id === channelId) {
      await next();
    }
  };
}
