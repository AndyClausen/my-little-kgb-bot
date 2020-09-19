import { GuardFunction } from '@typeit/discord';

export const IsDMChannel: GuardFunction<'message'> = async ([message], client, next) => {
  if (!message.guild && !message.author.bot) {
    await next();
  }
};
