import {
  SlashChoice,
  Client,
  Discord,
  SlashGroup,
  Guard,
  SlashOption,
  Slash,
  SlashChoiceType,
} from 'discordx';
import { DocumentType } from '@typegoose/typegoose';
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';

import ConfigModel, { Config as ConfigClass } from '../db/models/config';
import { Server } from '../db/models/server';
import IsValidKey from '../guards/config/is-valid-key';
import ServerExists from '../guards/config/server-exists';
import GuardCache from '../types/GuardCache';
import { IsAdmin } from '../guards/commands/is-admin';
import scheduleBirthdayMessage from '../helpers/schedule-birthday-message';

@Discord()
@Guard(ServerExists, IsAdmin)
@SlashGroup({ name: 'config', description: 'Configure me however you want, zaddy' })
@SlashGroup('config')
export default class Config {
  private readonly validBooleans: ReadonlyArray<string | number> = ['true', 'false', 1, 0];

  @Slash({ name: 'list', description: 'shows current config' })
  async list(
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    let str = 'Current configuration: \n```\n';
    Object.keys(ConfigModel.schema.paths).forEach(
      (k: keyof ConfigClass) => (str += `${k}: ${server.config[k]}\n`)
    );
    str += '```';
    await interaction.reply({ content: str, ephemeral: true });
  }

  @Slash({ name: 'enable', description: 'enable a feature/setting' })
  @Guard(IsValidKey)
  async enable(
    @SlashChoice(
      ...Object.keys(ConfigModel.schema.paths)
        .filter(ConfigClass.isBooleanProp)
        .map<SlashChoiceType>((key) => ({ name: key, value: key }))
    )
    @SlashOption({
      name: 'key',
      type: ApplicationCommandOptionType.String,
      description: 'key in config',
    })
    key: keyof ConfigClass,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await this.toggle(key, interaction, client, server, true);
  }

  @Slash({ name: 'disable', description: 'disable a feature/setting' })
  @Guard(IsValidKey)
  async disable(
    @SlashChoice(
      ...Object.keys(ConfigModel.schema.paths)
        .filter(ConfigClass.isBooleanProp)
        .map<SlashChoiceType>((key) => ({ name: key, value: key }))
    )
    @SlashOption({
      name: 'key',
      type: ApplicationCommandOptionType.String,
      description: 'key in config',
    })
    key: keyof ConfigClass,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    await this.toggle(key, interaction, client, server, false);
  }

  async toggle(
    key: keyof ConfigClass,
    interaction: CommandInteraction,
    client: Client,
    server: DocumentType<Server>,
    toggle: boolean
  ): Promise<void> {
    if (!ConfigClass.isBooleanProp(key)) {
      await interaction.reply({ content: `${key} is not a boolean!`, ephemeral: true });
      return;
    }

    server.config[key] = toggle;
    await server.save();
    await interaction.reply({
      content: `${key} has been ${toggle ? 'enabled' : 'disabled'}`,
      ephemeral: true,
    });
  }

  @Slash({ name: 'set', description: 'set a config key to a value' })
  @Guard(IsValidKey)
  async set(
    @SlashChoice(
      ...Object.keys(ConfigModel.schema.paths).map<SlashChoiceType>((key) => ({
        name: key,
        value: key,
      }))
    )
    @SlashOption({
      name: 'key',
      type: ApplicationCommandOptionType.String,
      description: 'key in config',
    })
    key: keyof ConfigClass,
    @SlashOption({
      name: 'value',
      type: ApplicationCommandOptionType.String,
      description: 'value to set to',
    })
    value: string,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!ConfigClass.isValidKey(key)) {
      await interaction.reply({ content: `Invalid key ${key}!`, ephemeral: true });
      return;
    }

    if (ConfigClass.isStringProp(key)) {
      server.config[key] = value;
    } else if (ConfigClass.isNumberProp(key)) {
      const numValue = Number(value);
      if (!numValue) {
        await interaction.reply({ content: 'Please enter a valid number', ephemeral: true });
        return;
      }
      if (key === 'birthdayHour') {
        if (numValue < 0 || numValue > 23 || numValue % 1 !== 0) {
          await interaction.reply({
            content: 'Please enter a whole number between 0 and 23',
            ephemeral: true,
          });
          return;
        }
      }
      if (key === 'susChance') {
        if (numValue <= 0 || numValue > 1) {
          await interaction.reply({
            content: 'Please enter a number between 0 and 1',
            ephemeral: true,
          });
          return;
        }
      }
      server.config[key] = numValue;
    } else if (ConfigClass.isBooleanProp(key)) {
      if (!this.validBooleans.includes(value)) {
        await interaction.reply(
          `Invalid value '${value}' for key '${key}'! Valid values: ${this.validBooleans.join(
            ', '
          )}`
        );
        return;
      }
      server.config[key] = ['true', 1].includes(value);
    } else {
      await interaction.reply({
        content: 'Unknown type! Please report this to Andy.',
        ephemeral: true,
      });
      return;
    }
    await server.save();
    await interaction.reply({
      content: `${key} has been set to ${server.config[key]}`,
      ephemeral: true,
    });
    if (key === 'birthdayHour') {
      scheduleBirthdayMessage(client, server);
    }
  }

  @Slash({ name: 'get', description: 'get the value of a config key' })
  @Guard(IsValidKey)
  async get(
    @SlashChoice(
      ...Object.keys(ConfigModel.schema.paths).map<SlashChoiceType>((key) => ({
        name: key,
        value: key,
      }))
    )
    @SlashOption({
      name: 'key',
      type: ApplicationCommandOptionType.String,
      description: 'key in config',
    })
    key: keyof ConfigClass,
    interaction: CommandInteraction,
    client: Client,
    { server }: GuardCache
  ): Promise<void> {
    if (!ConfigClass.isValidKey(key)) {
      await interaction.reply({ content: `Invalid key ${key}!`, ephemeral: true });
      return;
    }
    await interaction.reply({ content: `${key}: ${server.config[key]}`, ephemeral: true });
  }
}
