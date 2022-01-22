import { Snowflake } from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';
import CitizenModel, { Citizen } from './models/citizen';

export async function getOrCreateCitizen(userId: Snowflake): Promise<DocumentType<Citizen>> {
  let citizen = await CitizenModel.findById(userId);
  if (!citizen) {
    citizen = await CitizenModel.create({ _id: userId, dings: 0, gulagCount: 0 });
  }
  return citizen;
}
