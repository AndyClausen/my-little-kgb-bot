import { ArgsOf, Client, Command, CommandMessage, Discord, Guard, On } from '@typeit/discord';
import { Message } from 'discord.js';
import * as Path from 'path';

import { IsDMChannel } from './guards/messages/is-dm-channel';
import { NotBot } from './guards/messages/not-bot';
import { FromUser } from './guards/messages/from-user';
import sendMessageToUser from './helpers/send-message-to-user';

@Discord('!', {
  import: [Path.join(__dirname, 'commands', '*.ts'), Path.join(__dirname, 'hooks', '*.ts')],
})
export class Bot {
  @Command()
  async help(command: CommandMessage<never>): Promise<void> {
    await command.reply(
      'Available commands: \n```' +
        Client.getCommands()
          .filter((c) => c.commandName !== 'respond :userId')
          .map((c) => c.commandName)
          .join('\n') +
        '\n```'
    );
  }

  @On('message')
  @Guard(IsDMChannel)
  @Guard(NotBot)
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

  @Command('respond :userId')
  @Guard(IsDMChannel)
  @Guard(FromUser(process.env.OWNER_ID))
  async respondToUser(command: CommandMessage<{ userId: string }>): Promise<void> {
    const message = command.commandContent.substr(9 + command.args.userId.toString().length);
    await sendMessageToUser(command.client, command.args.userId, message);
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
