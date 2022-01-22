import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import Typegoose from '@typegoose/typegoose';
const { getModelForClass, prop } = Typegoose;
import { Snowflake } from 'discord.js';

export class Citizen extends TimeStamps {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ default: 0, required: true })
  dings!: number;

  @prop({ default: 0, required: true })
  gulagCount!: number;
}

const CitizenModel = getModelForClass(Citizen);

export default CitizenModel;
