
function createListTemplate(listGroupOfFour, payloadText, endOfList) {
  const finalListTemplate = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: listGroupOfFour,
        buttons: endOfList ? [
          {
            title: 'Return To Loans',
            type: 'postback',
            payload: 'USER ASKED TO SEE LOANS'
          }
        ] : [
          {
            title: 'View More',
            type: 'postback',
            payload: payloadText
          }
        ]
      }
    }
  };
  return finalListTemplate;
}

function acceptButton(quoteNumber) {
  return {
    content_type: 'text',
    title: 'Reject',
    payload: `reject:${quoteNumber}`,
    image_url: 'http://www.colorcombos.com/images/colors/FF0000.png'
  };
}

function rejectButton(quoteNumber) {
  return {
    content_type: 'text',
    title: 'Accept',
    payload: `accept:${quoteNumber}`,
    image_url: 'http://www.colorcombos.com/images/colors/00FF00.png'
  };
}

function returnButton(title, payload) {
  return {
    content_type: 'text',
    title,
    payload,
    image_url: 'http://www.colorcombos.com/images/colors/000084.png'
  };
}


module.exports = {
  createListTemplate,
  acceptButton,
  rejectButton,
  returnButton
  // returnToQuotesButton,
  // acceptRejectReturnButtons
};
