function createButtonsArray() {
  const dayButtons = [];
  for (i = 1; i <= 31; i++) {
    dayButtons.push(
      {
        // content_type: 'text',
        // title: `${i}`,
        // payload: `USER SELECTED DAYS:${i}`
        type: 'postback',
        title: `${i}`,
        payload: `USER SELECTED DAYS:${i}`
      }
    );
  }
  return dayButtons;
}

function daysOfMonth() {
  const dayButtons = createButtonsArray();
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Choose Number Of Days',
        buttons: dayButtons
      }
    }
  };
}

module.exports = {
  daysOfMonth
};

