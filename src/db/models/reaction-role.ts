import { Snowflake } from 'discord.js';
import Typegoose from '@typegoose/typegoose';
const { prop } = Typegoose;

export class ReactionRole {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  emoji!: string;
}
