import { Client, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx';
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';

import ServerExists from '../guards/config/server-exists';
import { IsAdmin } from '../guards/commands/is-admin';
import GuardCache from '../types/GuardCache';
import CitizenModel from '../db/models/citizen';
import scheduleBirthdayMessage from '../helpers/schedule-birthday-message';

@Discord()
@SlashGroup({ name: 'birthday', description: 'The Union never forgets your birthday' })
@SlashGroup('birthday')
export default class Birthday {
  @Slash({ name: 'set', description: 'Set your birthday' })
  async set(
    @SlashOption({
      name: 'date',
      description: 'date of your birthday',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 31,
    })
    date: number,
    @SlashOption({
      name: 'month',
      description: 'month of your birthday',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 12,
    })
    month: number,
    @SlashOption({
      name: 'year',
      description: 'year you were born',
      required: false,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1900,
      maxValue: 2023,
    })
    year: number | undefined,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    const citizen = await CitizenModel.findById(interaction.user.id);
    citizen.birthdayDate = date;
    citizen.birthdayMonth = month;
    citizen.birthdayYear = year;
    await citizen.save();
    await interaction.followUp({ content: 'Birthday saved!' });
  }

  @Slash({ name: 'forget', description: 'Removes your birthday from the database' })
  async forget(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const citizen = await CitizenModel.findById(interaction.user.id);
    citizen.birthdayDate = undefined;
    citizen.birthdayMonth = undefined;
    citizen.birthdayYear = undefined;
    await citizen.save();
    await interaction.followUp({ content: `I'll forget your birthday... 😢` });
  }

  @Slash({ name: 'register-channel', description: 'Send birthday messages in this channel' })
  @Guard(ServerExists, IsAdmin)
  async registerChannel(interaction: CommandInteraction, client: Client, { server }: GuardCache) {
    await interaction.deferReply({ ephemeral: true });
    server.birthdayChannel = interaction.channelId;
    scheduleBirthdayMessage(client, server);
    await server.save();
    await interaction.followUp('Birthday messages will now be sent in this channel 🎂');
  }

  @Slash({ name: 'help', description: 'Get help for setting up birthdays' })
  @Guard(ServerExists, IsAdmin)
  async help(interaction: CommandInteraction) {
    await interaction.reply({
      content: `In order to get birthday messages in your server, you must:
1) Register a channel with \`/birthday register-channel\` where the birthday messages will be sent.
2) Add a message template with \`/config set birthdayTemplate\` and optionally \`birthdayTemplateWithAge\`. You can use \`{name}\`, \`{age}\` and \`{ageth}\` in the template to insert the name and the age in the message. The age message is optional.
   Example: \`Happy {ageth} birthday {name}! You may be {age}, but you look like you're in your prime ;)\`
3) Add a designated hour (UTC) to send the birthday messages with \`/config set birthdayHour\`
4) Have your members set their birthday with \`/birthday set\`.`,
      ephemeral: true,
    });
  }
}
