import Typegoose from '@typegoose/typegoose';
const { getModelForClass, prop } = Typegoose;
import { Snowflake } from 'discord.js';
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';

export class Volunteer extends TimeStamps {
  @prop({ type: String })
  _id!: Snowflake;

  @prop({ type: () => [String], default: [], required: true })
  roles!: Snowflake[];
}

const VolunteerModel = getModelForClass(Volunteer);

export default VolunteerModel;
