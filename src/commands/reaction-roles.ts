import { Client, Command, CommandMessage, Guard } from '@typeit/discord';

import { ReactionRole } from '../db/models/reaction-role';
import ServerExists from '../guards/config/server-exists';
import IsConfigEnabled from '../guards/config/is-config-enabled';
import GuardCache from '../types/GuardCache';
import upsertReactionMessage from '../helpers/upsert-reaction-message';

export default class ReactionRoles {
  @Command('roles register')
  @Guard(ServerExists, IsConfigEnabled('reactionRoles'))
  async register(
    command: CommandMessage<{ roleId: string; name: string; emoji: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await command.react('👍');
    server.reactionRolesChannelId = command.channel.id;
    await server.save();
    await upsertReactionMessage(client, server);
  }

  @Command('roles add :roleId :name :emoji')
  @Guard(ServerExists, IsConfigEnabled('reactionRoles'))
  async add(
    command: CommandMessage<{ roleId: string; name: string; emoji: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { roleId, name, emoji } = command.args;
    if (!roleId || !name || !emoji) {
      await command.reply(`Usage: ${command.prefix}roles add <roleId> <name> <emoji>`);
      return;
    }
    if (!(await command.guild.roles.fetch(roleId))) {
      await command.reply(`Could not find role with id '${roleId}'`);
      return;
    }
    if (!command.guild.emojis.resolveIdentifier(emoji)) {
      await command.reply(`Could not resolve emoji '${emoji}'`);
      return;
    }

    const reactionRole: ReactionRole = {
      _id: roleId,
      name,
      emoji,
    };
    server.reactionRoles.push(reactionRole);
    await server.save();

    await command.reply(
      server.config.reactionRoles
        ? 'Role added!'
        : 'Role was added, but reaction roles are turned off'
    );
  }

  @Guard(ServerExists, IsConfigEnabled('reactionRoles'))
  @Command('roles remove :roleId')
  async remove(
    command: CommandMessage<{ roleId: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { roleId } = command.args;
    if (!roleId) {
      await command.reply(`Usage: ${command.prefix}roles remove <roleId>`);
      return;
    }
    const role = server.reactionRoles.find((rr) => rr._id === roleId);
    if (!role) {
      await command.reply(`Could not find role with id '${roleId}'`);
      return;
    }

    server.reactionRoles.remove(role);
    await server.save();

    await command.reply(
      server.config.reactionRoles
        ? 'Role removed!'
        : 'Role was removed, but reaction roles are turned off'
    );
  }

  @Guard(ServerExists, IsConfigEnabled('reactionRoles'))
  @Command('roles list')
  async list(
    command: CommandMessage<never>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = 'Roles: \n```\n';
    server.reactionRoles.forEach((role) => (msg += `${role._id} | ${role.name} | ${role.emoji}\n`));
    msg += '```';
    await command.reply(msg);
  }
}
