import { GuardFunction } from '@typeit/discord';

import { Config } from '../../db/models/config';
import PropsOfType from '../../types/PropsOfType';
import GuardCache from '../../types/GuardCache';

export default function IsConfigEnabled(
  key: PropsOfType<Config, boolean>
): GuardFunction<'message', GuardCache> {
  return async (args, client, next, { server }) => {
    if (!server.config[key]) {
      return;
    }
    await next();
  };
}
