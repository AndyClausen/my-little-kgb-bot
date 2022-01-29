import { Client, Discord, Guard, SlashOption, Slash } from 'discordx';
import {
  CommandInteraction,
  DiscordAPIError,
  GuildMember,
  StageChannel,
  User,
  VoiceChannel,
} from 'discord.js';

import { IsAdmin } from '../guards/commands/is-admin';
import getRandomInt from '../helpers/get-random-int';
import ServerExists from '../guards/config/server-exists';
import { Volunteer } from '../db/models/volunteer';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import GuardCache from '../types/GuardCache';
import { IsMod } from '../guards/commands/is-mod';

@Discord()
@Guard(ServerExists, IsMod)
export default abstract class Moderation {
  @Guard(IsAdmin)
  @Slash('move', { description: 'Move all users from one voice channel to another' })
  async bulkMove(
    @SlashOption('to', {
      type: 'CHANNEL',
      description: 'Channel to move to',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE'],
    })
    channelTo: VoiceChannel | StageChannel,
    @SlashOption('from', {
      type: 'CHANNEL',
      description: 'Channel to move from',
      channelTypes: ['GUILD_VOICE', 'GUILD_STAGE_VOICE'],
      required: false,
    })
    channelFrom: VoiceChannel | StageChannel,
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
          return member.voice.setChannel(channelTo);
        })
      );
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e;
      }
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

  @Guard(IsAdmin)
  @Slash('gulag')
  async gulag(
    @SlashOption('user', {
      type: 'USER',
      description: 'User to gulag',
    })
    user: User,
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
    const [roles, immutableRoles] = [
      ...member.roles.cache.filter((role) => !role.tags?.premiumSubscriberRole).keys(),
    ].reduce<[string[], string[]]>(
      ([a, b], roleId) => {
        ([interaction.guild.id, adminRole].includes(roleId) ? b : a).push(roleId);
        return [a, b];
      },
      [[], []]
    );
    if (roles.length) {
      try {
        await member.roles.set([...immutableRoles, gulagRole], 'gulag');
      } catch (e) {
        if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
          await interaction.reply({
            content: `I don't have permissions to set one or more of this person's roles!`,
            ephemeral: true,
          });
          return;
        }
        throw e;
      }
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
    })
    user: User,
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
    const roles = (volunteer?.roles || [memberRole])
      .concat(member.roles.cache.map((r) => r.id).filter((r) => r !== gulagRole))
      .filter((r) => r);
    if (roles.filter((r) => r).length) {
      await member.roles.set(roles, 'ungulag');
    }

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
    await citizen.save();
    await interaction.reply(messages[getRandomInt(0, messages.length - 1)]);
  }

  @Guard(IsAdmin)
  @Slash('purge', { description: 'Purge a bunch of messages that are totally not poggers' })
  async purge(
    @SlashOption('amount', {
      type: 'NUMBER',
      description: 'Amount of messages to delete',
      minValue: 1,
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

    await interaction.reply('Cleaning up...');
    const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
    await interaction.channel.bulkDelete(
      messages.filter((msg) => msg.interaction?.id !== interaction.id)
    );
    await interaction.deleteReply();
  }
}
