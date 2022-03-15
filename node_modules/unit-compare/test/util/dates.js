import moment from 'moment';

export function createDate(n, unit = 'days') {
  return moment().subtract(n, unit);
}
