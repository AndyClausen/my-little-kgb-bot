import { ArgsOf, Discord, Guard, On, SlashOption, Slash } from 'discordx';
import { CommandInteraction, Message, User } from 'discord.js';

import { IsDMChannel } from './guards/messages/is-dm-channel';
import { FromUser } from './guards/messages/from-user';
import sendMessageToUser from './helpers/send-message-to-user';

@Discord()
export class Bot {
  @On('messageCreate')
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
    @SlashOption('user', { type: 'USER' })
    user: User,
    @SlashOption('message', { type: 'STRING' })
    message: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await sendMessageToUser(interaction.client, user.id, message);
  }

  @On('messageCreate')
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
