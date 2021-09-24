import { Client, Discord, Guard, SlashOption, Slash } from 'discordx';
import {
  BaseGuildVoiceChannel,
  CommandInteraction,
  DiscordAPIError,
  GuildChannel,
  GuildMember,
  User, VoiceChannelResolvable
} from "discord.js";

import { IsAdmin } from '../guards/commands/is-admin';
import getRandomInt from '../helpers/get-random-int';
import ServerExists from '../guards/config/server-exists';
import { Volunteer } from '../db/models/volunteer';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import GuardCache from '../types/GuardCache';

@Discord()
@Guard(ServerExists, IsAdmin)
export default abstract class Moderation {
  @Slash('move', { description: 'Move all users from one voice channel to another' })
  async bulkMove(
    @SlashOption('to', {
      type: 'CHANNEL',
      description: 'Channel to move to',
      required: true,
    })
    channelTo: GuildChannel,
    @SlashOption('from', {
      type: 'CHANNEL',
      description: 'Channel to move from',
      required: false,
    })
    channelFrom: GuildChannel,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!(interaction.member instanceof GuildMember)) {
      return;
    }
    if (!channelFrom) {
      channelFrom = interaction.member.voice.channel;
      if (!channelFrom) {
        await interaction.reply(
          `You must be in a voice channel to call this command with only one parameter`
        );
        return;
      }
    }

    if (
      !(channelFrom instanceof BaseGuildVoiceChannel && channelTo instanceof BaseGuildVoiceChannel)
    ) {
      await interaction.reply({
        content: `The channels _must_ be voice or stage channels!`,
        ephemeral: true,
      });
      return;
    }

    const channelSize = channelFrom.members.size;
    try {
      channelFrom.members.mapValues((member) => {
        if (channelTo.permissionsFor(member).missing('CONNECT').length) {
          const err = new Error(member.id);
          err.name = 'missingConnectPerm';
          throw err;
        }
      });
      await Promise.all(
        channelFrom.members.mapValues((member) => {
          return member.voice.setChannel(channelTo as VoiceChannelResolvable);
        })
      );
    } catch (e) {
      if (e.name === 'missingConnectPerm') {
        await interaction.reply({
          content: `Member <@${e.message}> does not have permission to connect to ${channelTo.name}`,
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({ content: `${e.name}: ${e.message}`, ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `Done! Moved ${channelSize} user${channelSize > 1 ? 's' : ''}.`,
      ephemeral: true,
    });
  }

  @Slash('gulag')
  async gulag(
    @SlashOption('user', {
      type: 'USER',
      description: 'User to gulag',
      required: true,
    })
    user: User | GuildMember,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const member = await interaction.guild.members.fetch(user);
    if (!member) {
      await interaction.reply({ content: `Please give a user ID as argument!`, ephemeral: true });
      return;
    }

    const { gulagRole, adminRole } = server.config;
    if (!gulagRole) {
      await interaction.reply({
        content: 'You have not set a gulag role in the config!',
        ephemeral: true,
      });
      return;
    }

    if (server.gulag.find((volunteer) => volunteer._id === member.id)) {
      await interaction.reply({ content: `${member} is already in gulag`, ephemeral: true });
      return;
    }
    const roles = [
      ...member.roles.cache.filter((role) => !role.tags?.premiumSubscriberRole).keys(),
    ].filter((roleId) => ![interaction.guild.id, adminRole].includes(roleId));
    if (roles.length) {
      try {
        await member.roles.remove(roles, 'gulag');
      } catch (e) {
        if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
          await interaction.reply({
            content: `I don't have permissions to remove one or more of this person's roles!`,
            ephemeral: true,
          });
          return;
        }
        throw e;
      }
    }
    try {
      await member.roles.add(gulagRole, 'gulag');
    } catch (e) {
      if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
        await interaction.reply({
          content: `I don't have permissions to add the gulag role to this person!`,
          ephemeral: true,
        });
        return;
      }
      throw e;
    }

    const volunteer: Volunteer = { _id: member.id, roles: roles };
    server.gulag.push(volunteer);
    await server.save();

    await member.voice?.disconnect('gulag');

    const messages = [
      `Bend over, ${member}, and get ready for the Glorious Leader`,
      `${member} has ~~been sent to~~ voluntarily signed up for the gulag`,
      `${member} suddenly vanished`,
      `${member} went poof`,
      `${member} dun did a whoopsie and is being spanked in the gulag`,
      `Have a nice vacation, ${member}!`,
      `Congratulation ${member} - you've won an all-inclusive stay at the gulag!`,
    ];

    const citizen = await getOrCreateCitizen(member.id);
    citizen.gulagCount++;
    await citizen.save();
    await interaction.reply({
      content: messages[getRandomInt(0, messages.length - 1)],
      ephemeral: false,
    });
  }

  @Slash('ungulag')
  async ungulag(
    @SlashOption('user', {
      type: 'USER',
      description: 'User to gulag',
      required: true,
    })
    user: User | GuildMember,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const member = await interaction.guild.members.fetch(user);
    if (!member) {
      await interaction.reply({ content: `Please give a user ID as argument!`, ephemeral: true });
      return;
    }

    const { gulagRole, memberRole } = server.config;
    if (!gulagRole) {
      await interaction.reply({
        content: 'You have not set a gulag role in the config!',
        ephemeral: true,
      });
      return;
    }

    const volunteer = server.gulag.find((volunteer) => volunteer._id === member.id);
    if (!volunteer && !member.roles.cache.has(gulagRole)) {
      await interaction.reply({ content: `${member} is not in the gulag`, ephemeral: true });
      return;
    }
    const roles = volunteer?.roles || [memberRole];
    if (roles.filter((r) => !!r).length) {
      await member.roles.add(roles, 'ungulag');
    }
    await member.roles.remove(gulagRole, 'ungulag');

    // remove from db if not new member
    if (volunteer) {
      server.gulag.remove(volunteer);
      await server.save();
    }

    const messages = [
      `Welcome back, ${member} - hope you enjoyed your stay in the gulag!`,
      `After much hard work in the gulag, ${member} has been welcomed back into society.`,
      `Hope you learned your lesson, ${member}. If not, the gulag is always open.`,
      `${member} has returned from ~~the depths of hell~~ their vacation in the Gulag :)`,
      `${member} has completed their work quota and has been congratulated on their service for the Union.`,
      `${member} has served their gulag ~~sentence~~ vacation and been released back into the public. Good luck!`,
    ];

    const citizen = await getOrCreateCitizen(member.id);
    citizen.gulagCount--;
    await citizen.save();
    await interaction.reply(messages[getRandomInt(0, messages.length - 1)]);
  }

  @Slash('purge', { description: 'Purge a bunch of messages that are totally not poggers' })
  async purge(
    @SlashOption('amount', {
      description: 'Amount of messages to delete',
      required: true,
    })
    amount: number,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.channel.isText()) {
      return;
    }
    if (interaction.channel.type === 'DM') {
      await interaction.reply({
        content: `I can't purge messages in a dm, baka!`,
        ephemeral: true,
      });
      return;
    }
    if (typeof amount !== 'number') {
      await interaction.reply({ content: `Amount must be a number`, ephemeral: true });
      return;
    }
    if (amount <= 0) {
      await interaction.reply({ content: `Amount must be greater than 0`, ephemeral: true });
      return;
    }

    await interaction.reply('Cleaning up...');
    const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
    await interaction.channel.bulkDelete(
      messages.filter((msg) => msg.interaction?.id !== interaction.id)
    );
    await interaction.deleteReply();
  }
}
