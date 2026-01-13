function twoDigits(number) {
  const str = number + "";
  if (str.length === 1) {
    return "0" + str;
  }
  return str;
}

function getTimestamp() {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();

  return date.getFullYear() + twoDigits(month) + twoDigits(day) + twoDigits(hour) + twoDigits(min) + twoDigits(sec);
}

export default getTimestamp;
