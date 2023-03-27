import { Client, Discord, SlashGroup, Guard, SlashOption, Slash } from 'discordx';
import { CommandInteraction, Role } from 'discord.js';

import { ReactionRole } from '../db/models/reaction-role';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import upsertReactionMessage from '../helpers/upsert-reaction-message';

@Discord()
@Guard(ServerExists)
@SlashGroup({ name: 'roles', description: 'Like normal roles, but, like, automated' })
@SlashGroup({
  name: 'reaction',
  description: 'React to a message to get a role! How neat is that?',
  root: 'roles',
})
export default abstract class Roles {
  @Slash('register', { description: 'Register a channel to post the reaction roles message' })
  @SlashGroup('reaction')
  async register(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    server.reactionRolesChannelId = interaction.channel.id;
    await server.save();
    await upsertReactionMessage(client, server);
    await interaction.reply({ content: 'Channel successfully registered!', ephemeral: true });
  }

  @Slash('add')
  @SlashGroup('reaction')
  async add(
    @SlashOption('role', { type: 'ROLE', description: 'Role to add' })
    role: Role,
    @SlashOption('name', { description: 'The name of the role' })
    name: string,
    @SlashOption('emoji', { description: 'An emoji to use as reaction' })
    emoji: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!interaction.guild.emojis.resolveIdentifier(emoji)) {
      await interaction.reply({ content: `Could not resolve emoji '${emoji}'`, ephemeral: true });
      return;
    }

    const reactionRole: ReactionRole = {
      _id: role.id,
      name,
      emoji,
    };
    server.reactionRoles.push(reactionRole);
    await server.save();
    await upsertReactionMessage(client, server);

    await interaction.reply('Role added!');
  }

  @Slash('remove')
  @SlashGroup('reaction')
  async remove(
    @SlashOption('role', { type: 'ROLE', description: 'Role to remove' })
    role: Role,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const reactionRole = server.reactionRoles.find((rr) => rr._id === role.id);
    if (!reactionRole) {
      await interaction.reply({
        content: `Could not find reaction role with id '${role.id}'`,
        ephemeral: true,
      });
      return;
    }

    server.reactionRoles.remove(reactionRole);
    await server.save();
    await upsertReactionMessage(client, server);

    await interaction.reply('Role removed!');
  }

  @Slash('list')
  @SlashGroup('reaction')
  async list(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = 'Roles: \n```\n';
    server.reactionRoles.forEach((role) => (msg += `${role._id} | ${role.name} | ${role.emoji}\n`));
    msg += '```';
    await interaction.reply({ content: msg, ephemeral: true });
  }
}
