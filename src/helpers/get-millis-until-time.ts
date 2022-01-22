import moment from 'moment';

export default function getMillisUntilTime(hours: number, minutes: number): number {
  const nextTime = moment().hours(hours).minutes(minutes).startOf('minute');
  if (nextTime.isBefore(moment())) {
    nextTime.add(1, 'day');
  }
  return nextTime.diff(moment(), 'milliseconds');
}
