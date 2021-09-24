import * as mongoose from 'mongoose';

export default async function configMongoose(
  hostname: string,
  database: string,
  username: string,
  password: string
): Promise<mongoose.Connection> {
  return mongoose.createConnection(
    `mongodb+srv://${username}:${password}@${hostname}/${database}`,
    {
      retryWrites: true,
      w: 'majority',
    }
  );
}
