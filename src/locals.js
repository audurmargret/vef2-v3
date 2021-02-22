export function dayFormat(today) {
  const day = today.getDate().toString();
  const month = (today.getMonth() + 1).toString();
  const year = today.getFullYear().toString();

  const s = day.concat('.').concat(month).concat('.').concat(year);
  return s;
}

export function errors(value, where) {
  for (let i = 0; i < value.length; i += 1) {
    if (value[i].param === where) {
      return true;
    }
  }
  return false;
}

export function count (list) {
  return list.length;
}