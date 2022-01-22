import mongoose from 'mongoose';

export default async function configMongoose(
  hostname: string,
  database: string,
  username: string,
  password: string
): Promise<mongoose.Mongoose> {
  return mongoose.connect(`mongodb+srv://${username}:${password}@${hostname}/${database}`, {
    retryWrites: true,
    w: 'majority',
  });
}
