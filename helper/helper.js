function createRfqList(listGroupOfFour, payloadText, endOfRfqList) {
  // const endOfRFQButton = { title: 'You Have No More Loan Requests',
  //   subtitle: 'All Available Loan Requests Have Been Presented',
  //   buttons: [
  //     {
  //       type: 'postback',
  //       title: 'See Loan Requests',
  //       payload: 'USER ASKED TO SEE LOANS'
  //     }
  //   ]
  // };
  // const listHasLessThanFour = listGroupOfFour.length < 4;
  // if (listHasLessThanFour) { listGroupOfFour.push(endOfRFQButton); }
  const finalListTemplate = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: listGroupOfFour,
        buttons: endOfRfqList ? [
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

function createQuoteList(listGroupOfFour, payloadText, endOfQuoteList) {
  // const endOfQuoteButton = { title: 'You Have No More Quotes',
  //   subtitle: 'All Available Quotes Have Been Presented',
  //   buttons: [
  //     {
  //       type: 'postback',
  //       title: 'Return To Loans',
  //       payload: 'USER ASKED TO SEE LOANS'
  //     }
  //   ]
  // // };
  // const listHasLessThanFour = listGroupOfFour.length < 4;
  // if (listHasLessThanFour) { listGroupOfFour.push(endOfQuoteButton); }
  const finalListTemplate = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: listGroupOfFour,
        buttons: endOfQuoteList ? [
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
  // if (listHasLessThanFour) { delete finalListTemplate.attachment.payload.buttons; }
  return finalListTemplate;
}

module.exports = {
  createRfqList,
  createQuoteList
};
