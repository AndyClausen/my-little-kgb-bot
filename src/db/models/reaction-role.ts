import { Snowflake } from 'discord.js';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export class ReactionRole extends Base<string> {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  emoji!: string;
}
