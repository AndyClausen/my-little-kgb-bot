import { Client, Command, CommandMessage, Guard } from '@typeit/discord';

import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';

export default class VoiceChatRoles {
  @Command('roles voicechat add :roleId :channelId')
  @Guard(ServerExists)
  async addVoiceChatRole(
    command: CommandMessage<{ roleId: string; channelId: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { roleId, channelId } = command.args;

    if (!roleId || !channelId) {
      await command.reply(`Usage: ${command.prefix}roles voicechat add <roleId> <channelId>`);
      return;
    }
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply(`Could not find role with id '${roleId}'`);
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply(`Could not find channel with id '${channelId}'`);
      return;
    }
    if (server.voiceChatRoles.find((r) => r.roleId === roleId && r.channelId === channelId)) {
      await command.reply('That voice chat role already exists!');
      return;
    }

    server.voiceChatRoles.push({
      roleId,
      channelId,
    });
    await server.save();
    await command.channel.send('Voice chat role has been added');
  }

  @Command('roles voicechat remove :roleId :channelId')
  @Guard(ServerExists)
  async removeVoiceChatRole(
    command: CommandMessage<{ roleId: string; channelId: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { roleId, channelId } = command.args;

    if (!roleId || !channelId) {
      await command.reply(`Usage: ${command.prefix}roles voicechat remove <roleId> <channelId>`);
      return;
    }
    if (!command.guild.roles.cache.has(roleId)) {
      await command.reply(`Could not find role with id '${roleId}'`);
      return;
    }
    if (!command.guild.channels.cache.has(channelId)) {
      await command.reply(`Could not find channel with id '${channelId}'`);
      return;
    }
    if (server.voiceChatRoles.find((r) => r.roleId === roleId && r.channelId === channelId)) {
      await command.reply('That voice chat role already exists!');
      return;
    }

    server.voiceChatRoles.push({
      roleId,
      channelId,
    });
    await server.save();
    await command.channel.send('Voice chat role has been added');
  }

  @Command('roles voicechat list')
  @Guard(ServerExists)
  async listVoiceChatRole(
    command: CommandMessage<{ roleId: string; channelId: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let msg = '```\n';
    server.voiceChatRoles.forEach((r) => (msg += `Role: ${r.roleId}, Channel: ${r.channelId}\n`));
    msg += '```';
    await command.channel.send(msg);
  }
}
