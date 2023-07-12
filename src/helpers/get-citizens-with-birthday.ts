import CitizenModel from '../db/models/citizen';

export default async function getCitizensWithBirthday(month: number, date: number) {
  return CitizenModel.find({
    birthdayMonth: month,
    birthdayDate: date,
  });
}
