function createButtonsArray(message, number) {
  const dayButtons = [];
  for (i = 1; i <= number; i++) {
    dayButtons.push(
      {
        content_type: 'text',
        title: `${i}`,
        payload: `${message}${i}`
      }
    );
  }
  return dayButtons;
}

function daysOfWeek() {
  const dayButtons = createButtonsArray('NUMBER OF DAYS:', 7);
  return {
    text: 'Please Choose Number Of Days:',
    quick_replies: dayButtons
  };
}

function weeksInAMonth() {
  const dayButtons = createButtonsArray('NUMBER OF WEEKS:', 4);
  return {
    text: 'Please Choose Number Of Weeks:',
    quick_replies: dayButtons
  };
}

function MonthInAYear() {
  const dayButtons = createButtonsArray('NUMBER OF MONTHS:', 11);
  return {
    text: 'Please Choose Number Of Months:',
    quick_replies: dayButtons
  };
}

function numberOfYears() {
  const dayButtons = createButtonsArray('NUMBER OF YEARS:', 10);
  return {
    text: 'Please Choose Number Of Years:',
    quick_replies: dayButtons
  };
}

module.exports = {
  daysOfWeek,
  weeksInAMonth,
  MonthInAYear,
  numberOfYears
};

