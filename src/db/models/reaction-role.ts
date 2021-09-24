import { Snowflake } from 'discord.js';
import { prop } from '@typegoose/typegoose';

export class ReactionRole {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  emoji!: string;
}
