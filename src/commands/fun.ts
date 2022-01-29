import { Client, Discord, Guard, SlashOption, Slash } from 'discordx';
import { CommandInteraction, GuildMember, User } from 'discord.js';

import IsConfigEnabled from '../guards/config/is-config-enabled';
import ServerExists from '../guards/config/server-exists';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import GuardCache from '../types/GuardCache';

@Discord()
export default class Fun {
  @Slash('ding', {
    description: 'Make a game out of shaming someone for talking with their mic muted',
  })
  async ding(
    @SlashOption('user', { type: 'USER' })
    user: User,
    interaction: CommandInteraction
  ): Promise<void> {
    const member = await interaction.guild.members.fetch(user);
    if (!member) {
      await interaction.reply(`Could not find that member`);
      return;
    }
    const citizen = await getOrCreateCitizen(member.id);
    citizen.dings++;
    await citizen.save();
    await interaction.reply(
      `DING!\n${member} has now talked ${citizen.dings} times with their mic muted`
    );
  }

  @Slash('unding', { description: 'When you ding someone by mistake' })
  async unding(
    @SlashOption('user', { type: 'USER' })
    user: User,
    interaction: CommandInteraction
  ): Promise<void> {
    const member = await interaction.guild.members.fetch(user);
    if (!member) {
      await interaction.reply(`Could not find that member`);
      return;
    }
    const citizen = await getOrCreateCitizen(member.id);
    citizen.dings--;
    await citizen.save();
    await interaction.reply(
      `Someone did a whoopsie! Ding count for ${member} is now ${citizen.dings}.`
    );
  }

  @Slash('rr', { description: `Do it, you won't, no balls` })
  @Guard(ServerExists, IsConfigEnabled('russianRoulette'))
  async russianRoulette(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!(interaction.member instanceof GuildMember)) {
      return;
    }
    const mutedSeconds = 30;
    const roll = Math.random();
    const promises: Array<Promise<unknown>> = [];

    const { memberRole, gulagRole } = server.config;

    if (!memberRole || !gulagRole) {
      await interaction.reply(
        'Both `memberRole` and `gulagRole` must be set up for this to work properly'
      );
      return;
    }

    const hit = roll > 5 / 6;
    const hadMemberRole = interaction.member.roles.cache.has(memberRole);
    const hadGulagRole = interaction.member.roles.cache.has(gulagRole);

    let res: string;
    if (hit) {
      if (hadMemberRole) {
        promises.push(interaction.member.roles.remove(memberRole));
      }
      promises.push(
        interaction.member.roles.add(gulagRole),
        interaction.member.voice.setMute(true)
      );
      res = `**BANG!** You're dead, ${interaction.member}.`;
    } else {
      res = `**CLICK!** You lived, ${interaction.member}! For now...`;
    }
    promises.push(interaction.reply(res));

    await Promise.all(promises);

    // remove role after 10 seconds
    if (hit && interaction.member) {
      await new Promise((resolve) => setTimeout(resolve, mutedSeconds * 1000));
      if (!hadGulagRole) {
        await interaction.member.roles.remove(gulagRole);
      }
      if (hadMemberRole) {
        await interaction.member.roles.add(memberRole);
      }
      await interaction.member.voice.setMute(false);
    }
  }
}
