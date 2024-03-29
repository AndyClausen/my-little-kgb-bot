import { Client, Discord, Guard, SlashOption, Slash, ContextMenu } from 'discordx';
import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import IsConfigEnabled from '../guards/config/is-config-enabled';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import { ding, unding } from '../helpers/ding-helpers';
import { gulag, ungulag } from '../helpers/gulag-helpers';

@Discord()
export default class Fun {
  @ContextMenu({ name: 'ding', type: ApplicationCommandType.User })
  async dingUser(interaction: UserContextMenuCommandInteraction) {
    await ding(interaction.targetUser, interaction);
  }

  @ContextMenu({ name: 'unding', type: ApplicationCommandType.User })
  async undingUser(interaction: UserContextMenuCommandInteraction) {
    await unding(interaction.targetUser, interaction);
  }

  @Slash({
    name: 'ding',
    description: 'Make a game out of shaming someone for talking with their mic muted',
  })
  async dingCommand(
    @SlashOption({
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'user to ding',
    })
    user: User,
    interaction: CommandInteraction
  ): Promise<void> {
    await ding(user, interaction);
  }

  @Slash({ name: 'unding', description: 'When you ding someone by mistake' })
  async undingCommand(
    @SlashOption({
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'user to unding',
    })
    user: User,
    interaction: CommandInteraction
  ): Promise<void> {
    await unding(user, interaction);
  }

  @Slash({ name: 'rr', description: `Do it, you won't, no balls` })
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

    const isInGulag = interaction.member.roles.cache.has(gulagRole);

    if (isInGulag) {
      await interaction.reply(`Sorry kiddo, there's no playing games in the gulag.`);
      return;
    }

    let res: string;
    if (hit) {
      promises.push(gulag(interaction.user, server, interaction));
      res = `**BANG!** You're dead, ${interaction.member}.`;
    } else {
      res = `**CLICK!** You lived, ${interaction.member}! For now...`;
    }
    promises.push(interaction.reply(res));

    await Promise.all(promises);

    // remove role after 10 seconds
    if (hit && interaction.member) {
      await new Promise((resolve) => setTimeout(resolve, mutedSeconds * 1000));
      await ungulag(interaction.user, server, interaction);
    }
  }
}
