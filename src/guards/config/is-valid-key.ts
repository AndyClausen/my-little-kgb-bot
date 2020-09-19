import ConfigModel, { Config } from '../../db/models/config';
import { CommandMessage, GuardFunction } from '@typeit/discord';

const IsValidKey: GuardFunction<'commandMessage'> = async (
  [command]: [CommandMessage<{ key: string }>],
  client,
  next
) => {
  if (!Config.isValidKey(command.args.key)) {
    await command.channel.send(
      `Invalid key '${command.args.key}'! Available keys are:\n${Object.keys(
        ConfigModel.schema.paths
      )}`
    );
    return;
  }
  await next();
};

export default IsValidKey;
