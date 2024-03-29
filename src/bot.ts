import { ArgsOf, Discord, Guard, On, SlashOption, Slash } from 'discordx';
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Events,
  Message,
  User,
} from 'discord.js';

import { IsDMChannel } from './guards/messages/is-dm-channel';
import { FromUser } from './guards/messages/from-user';
import sendMessageToUser from './helpers/send-message-to-user';

@Discord()
export class Bot {
  @On({ event: Events.MessageCreate })
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

  @Slash({ name: 'respond', description: 'Send a DM message to a user' })
  @Guard(IsDMChannel)
  @Guard(FromUser(process.env.OWNER_ID))
  async respondToUser(
    @SlashOption({
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'User to send DM to',
    })
    user: User,
    @SlashOption({
      name: 'message',
      type: ApplicationCommandOptionType.String,
      description: 'Message to be sent',
    })
    message: string,
    interaction: CommandInteraction
  ): Promise<void> {
    await sendMessageToUser(interaction.client, user.id, message);
  }

  @On({ event: Events.MessageCreate })
  async insultResponse([message]: ArgsOf<Events.MessageCreate>): Promise<void> {
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
