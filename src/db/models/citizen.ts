import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { getModelForClass, prop } from "@typegoose/typegoose";
import { Snowflake } from "discord.js";

export class Citizen extends TimeStamps implements Base<string> {
  @prop({ type: String, required: true })
  _id!: Snowflake;

  @prop({ default: 0, required: true })
  dings!: number;

  @prop({ default: 0, required: true })
  gulagCount!: number;
}

const CitizenModel = getModelForClass(Citizen);

export default CitizenModel;
