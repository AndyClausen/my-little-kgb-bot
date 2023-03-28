import { CommandInteraction, DiscordAPIError, Snowflake, UserResolvable } from 'discord.js';
import { DocumentType } from '@typegoose/typegoose';

import { Volunteer } from '../db/models/volunteer';
import { getOrCreateCitizen } from '../db/get-or-create-citizen';
import getRandomInt from './get-random-int';
import { Server } from '../db/models/server';

export async function gulag(
  user: UserResolvable,
  server: DocumentType<Server>,
  interaction: CommandInteraction
) {
  const member = await interaction.guild.members.fetch(user);
  if (!member) {
    await interaction.reply({ content: `That user is not a member here!`, ephemeral: true });
    return;
  }
  const { gulagRole, adminRole } = server.config;
  if (!gulagRole) {
    await interaction.reply({
      content: 'You have not set a gulag role in the config!',
      ephemeral: true,
    });
    return;
  }

  if (server.gulag.find((volunteer) => volunteer._id === member.id)) {
    await interaction.reply({ content: `${member} is already in gulag`, ephemeral: true });
    return;
  }
  const [roles, immutableRoles] = [
    ...member.roles.cache.filter((role) => !role.tags?.premiumSubscriberRole).keys(),
  ].reduce<[Snowflake[], Snowflake[]]>(
    ([a, b], roleId) => {
      ([interaction.guild.id, adminRole].includes(roleId) ? b : a).push(roleId);
      return [a, b];
    },
    [[], []]
  );
  if (roles.length) {
    try {
      await member.roles.set([...immutableRoles, gulagRole], 'gulag');
    } catch (e) {
      if (e instanceof DiscordAPIError && e.message === 'Missing Permissions') {
        await interaction.reply({
          content: `I don't have permissions to set one or more of this person's roles!`,
          ephemeral: true,
        });
        return;
      }
      throw e;
    }
  }

  const volunteer: Volunteer = { _id: member.id, roles: roles };
  server.gulag.push(volunteer);
  await server.save();

  await member.voice?.disconnect('gulag');

  const messages = [
    `Bend over, ${member}, and get ready for the Glorious Leader`,
    `${member} has ~~been sent to~~ voluntarily signed up for the gulag`,
    `${member} suddenly vanished`,
    `${member} went poof`,
    `${member} dun did a whoopsie and is being spanked in the gulag`,
    `Have a nice vacation, ${member}!`,
    `Congratulation ${member} - you've won an all-inclusive stay at the gulag!`,
  ];

  const citizen = await getOrCreateCitizen(member.id);
  citizen.gulagCount++;
  await citizen.save();
  await interaction.reply({
    content: messages[getRandomInt(0, messages.length - 1)],
    ephemeral: false,
  });
}

export async function ungulag(
  user: UserResolvable,
  server: DocumentType<Server>,
  interaction: CommandInteraction
) {
  const member = await interaction.guild.members.fetch(user);
  if (!member) {
    await interaction.reply({ content: `That user is not a member here!`, ephemeral: true });
    return;
  }
  const { gulagRole, memberRole } = server.config;
  if (!gulagRole) {
    await interaction.reply({
      content: 'You have not set a gulag role in the config!',
      ephemeral: true,
    });
    return;
  }

  const volunteer = server.gulag.find((volunteer) => volunteer._id === member.id);
  if (!volunteer && !member.roles.cache.has(gulagRole)) {
    await interaction.reply({ content: `${member} is not in the gulag`, ephemeral: true });
    return;
  }
  const roles = (volunteer?.roles || [memberRole])
    .concat(member.roles.cache.map((r) => r.id).filter((r) => r !== gulagRole))
    .filter((r) => r);
  if (roles.filter((r) => r).length) {
    await member.roles.set(roles, 'ungulag');
  }

  // remove from db if not new member
  if (volunteer) {
    server.gulag.remove(volunteer);
    await server.save();
  }

  const messages = [
    `Welcome back, ${member} - hope you enjoyed your stay in the gulag!`,
    `After much hard work in the gulag, ${member} has been welcomed back into society.`,
    `Hope you learned your lesson, ${member}. If not, the gulag is always open.`,
    `${member} has returned from ~~the depths of hell~~ their vacation in the Gulag :)`,
    `${member} has completed their work quota and has been congratulated on their service for the Union.`,
    `${member} has served their gulag ~~sentence~~ vacation and been released back into the public. Good luck!`,
  ];

  const citizen = await getOrCreateCitizen(member.id);
  await citizen.save();
  await interaction.reply(messages[getRandomInt(0, messages.length - 1)]);
}
