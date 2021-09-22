import { Message, Snowflake, Client } from 'discord.js';

export default async function sendMessageToUser(
  client: Client,
  userId: Snowflake,
  message: string
): Promise<Message> {
  const user = await client.users.fetch(userId);
  const channelDM = await user.createDM();
  return channelDM.send(message);
}
