/* eslint-disable @typescript-eslint/no-floating-promises */
import { Client } from 'discordx';
import moment from 'moment';

import sendMessageToUser from './send-message-to-user';
import getMillisUntilTime from './get-millis-until-time';
import { ScheduledMessage } from '../db/models/scheduled-message';

export default function createScheduledMessage(
  client: Client,
  { userId, message, hour, minute, onlyWorkdays }: ScheduledMessage
): void {
  setTimeout(() => {
    if (!onlyWorkdays || moment().weekday() % 6) {
      void sendMessageToUser(client, userId, message);
    }
    setInterval(() => {
      if (!onlyWorkdays || moment().weekday() % 6) {
        void sendMessageToUser(client, userId, message);
      }
    }, 1000 * 60 * 60 * 24); // 24 hours in millis
  }, getMillisUntilTime(hour, minute));
}
