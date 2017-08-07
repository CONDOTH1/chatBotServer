function createRfqList(listGroupOfFour, payloadText) {
  const endOfRFQButton = { title: 'You Have No More Loan Requests',
    subtitle: 'All Available Loan Requests Have Been Presented',
    buttons: [
      {
        type: 'postback',
        title: 'See All Loan Requests',
        payload: 'USER ASKED TO SEE LOANS'
      }
    ]
  };

  if (listGroupOfFour.length < 4) { listGroupOfFour.push(endOfRFQButton); }
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'list',
        top_element_style: 'compact',
        elements: listGroupOfFour,
        buttons: [
          {
            title: 'View More',
            type: 'postback',
            payload: payloadText
          }
        ]
      }
    }
  };
}

module.exports = {
  createRfqList
};
