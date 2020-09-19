import * as mongoose from 'mongoose';

export default async function configMongoose(
  hostname: string,
  database: string,
  username: string,
  password: string
): Promise<mongoose.Connection> {
  const {connection} = await mongoose.connect(
    `mongodb+srv://${username}:${password}@${hostname}/${database}?retryWrites=true`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      w: 'majority',
    }
  );
  return connection;
}
