import { ArgsOf, Discord, Guard, On, Option, OptionType, Slash } from '@typeit/discord';
import { CommandInteraction, Message } from 'discord.js';

import { IsDMChannel } from './guards/messages/is-dm-channel';
import { FromUser } from './guards/messages/from-user';
import sendMessageToUser from './helpers/send-message-to-user';

@Discord()
export class Bot {
  @On('message')
  @Guard(IsDMChannel)
  async sendToAndy([message]: [Message]): Promise<void> {
    if (message.author.id === process.env.OWNER_ID) {
      return;
    }
    await sendMessageToUser(
      message.client,
      process.env.OWNER_ID,
      `From ${message.author.username} (ID: ${message.author.id}):`
    );
    await sendMessageToUser(message.client, process.env.OWNER_ID, message.content);
  }

  @Slash('respond')
  @Guard(IsDMChannel)
  @Guard(FromUser(process.env.OWNER_ID))
  async respondToUser(
    @Option('user', OptionType.USER)
    userId: string,
    @Option('message', OptionType.STRING)
    message: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await sendMessageToUser(interaction.client, userId, message);
  }

  @On('message')
  async insultResponse([message]: ArgsOf<'message'>): Promise<void> {
    const searchText = message.content.toLowerCase();
    if (
      ((searchText.includes('fuck') || searchText.includes('hate')) &&
        (searchText.includes('your bot') || searchText.includes('this bot'))) ||
      searchText.includes('fucking bot')
    ) {
      await message.channel.send('I may be a bot, but I still have feelings 😢');
    }
  }
}
