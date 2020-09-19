import { Client, Command, CommandMessage, Guard } from '@typeit/discord';
import { DocumentType } from '@typegoose/typegoose';

import ConfigModel, { Config as ConfigClass } from '../db/models/config';
import { Server } from '../db/models/server';
import IsValidKey from '../guards/config/is-valid-key';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';

export default class Config {
  private readonly validBooleans: ReadonlyArray<string | number> = ['true', 'false', 1, 0];

  @Command('config')
  @Guard(ServerExists)
  async config(command: CommandMessage<never>): Promise<void> {
    if (command.commandContent?.length > 'config'.length) {
      return;
    }
    return this.help(command);
  }

  @Command('config help')
  @Guard(ServerExists)
  async help(command: CommandMessage<never>): Promise<void> {
    await command.reply(`Available commands: list, set, get, enable, disable`);
  }

  @Command('config list')
  @Guard(ServerExists)
  async list(
    command: CommandMessage<never>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let str = 'Current configuration: \n```\n';
    Object.keys(ConfigModel.schema.paths).forEach(
      (k: keyof ConfigClass) => (str += `${k}: ${server.config[k]}\n`)
    );
    str += '```';
    await command.reply(str);
  }

  @Command('config enable :key')
  @Guard(IsValidKey)
  @Guard(ServerExists)
  async enable(
    command: CommandMessage<{ key: keyof ConfigClass }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await this.toggle(command, client, server, true);
  }

  @Command('config disable :key')
  @Guard(IsValidKey)
  @Guard(ServerExists)
  async disable(
    command: CommandMessage<{ key: keyof ConfigClass }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await this.toggle(command, client, server, false);
  }

  async toggle(
    command: CommandMessage<{ key: keyof ConfigClass }>,
    client: Client,
    server: DocumentType<Server>,
    toggle: boolean
  ): Promise<void> {
    const { key } = command.args;
    if (!key) {
      await command.reply(
        `Invalid amount of arguments! Usage: ${command.prefix}${command.commandName} <key>`
      );
      return;
    }
    if (!ConfigClass.isBooleanProp(key)) {
      await command.reply(`${key} is not a boolean!`);
      return;
    }

    server.config[key] = toggle;
    await server.save();
    await command.reply(`${key} has been set to ${server.config[key]}`);
  }

  @Command('config set :key :value')
  @Guard(IsValidKey)
  @Guard(ServerExists)
  async set(
    command: CommandMessage<{ key: keyof ConfigClass; value: string }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { key, value } = command.args;
    if (!key || !value) {
      await command.reply(
        `Invalid amount of arguments! Usage: ${command.prefix}config set <key> <value>`
      );
      return;
    }

    if (ConfigClass.isStringProp(key)) {
      server.config[key] = value;
    } else if (ConfigClass.isNumberProp(key)) {
      const numValue = Number(value);
      if (!numValue) {
        await command.reply('Please enter a valid number');
        return;
      }
      if (key === 'susChance') {
        if (numValue <= 0 || numValue > 1) {
          await command.reply('Please enter a number between 0 and 1');
          return;
        }
      }
      server.config[key] = numValue;
    } else if (ConfigClass.isBooleanProp(key)) {
      if (!this.validBooleans.includes(value)) {
        await command.reply(
          `Invalid value '${value}' for key '${key}'! Valid values: ${this.validBooleans.join(
            ', '
          )}`
        );
        return;
      }
      server.config[key] = ['true', 1].includes(value);
    } else {
      await command.reply('Unknown type! Please report this to Andy.');
      return;
    }
    await server.save();
    await command.reply(`${key} has been set to ${server.config[key]}`);
  }

  @Command('config get :key')
  @Guard(IsValidKey)
  @Guard(ServerExists)
  async get(
    command: CommandMessage<{ key: keyof ConfigClass }>,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    const { key } = command.args;
    if (!key) {
      await command.reply(`Invalid amount of arguments! Usage: ${command.prefix}config get <key>`);
      return;
    }
    await command.reply(`${key}: ${server.config[key]}`);
  }
}
