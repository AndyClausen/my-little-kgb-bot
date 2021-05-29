import ConfigModel, { Config } from '../../db/models/config';
import { GuardFunction, OptionType } from '@typeit/discord';
import { CommandInteraction } from 'discord.js';

const IsValidKey: GuardFunction<CommandInteraction> = async (
  interaction: CommandInteraction,
  client,
  next
) => {
  const key = (
    interaction.options[0]?.type === 'SUB_COMMAND'
      ? interaction.options[0].options
      : interaction.options
  )
    .find((o) => o.name === 'key' && o.type === OptionType.STRING)
    ?.value?.toString();
  if (!Config.isValidKey(key)) {
    await interaction.reply(
      `Invalid key '${key}'! Available keys are:\n${Object.keys(ConfigModel.schema.paths)}`
    );
    return;
  }
  await next();
};

export default IsValidKey;
