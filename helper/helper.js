// function createRfqList(listGroupOfFour, payloadText, endOfRfqList) {
//   const finalListTemplate = {
//     attachment: {
//       type: 'template',
//       payload: {
//         template_type: 'list',
//         top_element_style: 'compact',
//         elements: listGroupOfFour,
//         buttons: endOfRfqList ? [
//           {
//             title: 'Return To Loans',
//             type: 'postback',
//             payload: 'USER ASKED TO SEE LOANS'
//           }
//         ] : [
//           {
//             title: 'View More',
//             type: 'postback',
//             payload: payloadText
//           }
//         ]
//       }
//     }
//   };
//   return finalListTemplate;
// }

// function createQuoteList(listGroupOfFour, payloadText, endOfQuoteList) {
//   const finalListTemplate = {
//     attachment: {
//       type: 'template',
//       payload: {
//         template_type: 'list',
//         top_element_style: 'compact',
//         elements: listGroupOfFour,
//         buttons: endOfQuoteList ? [
//           {
//             title: 'Return To Loans',
//             type: 'postback',
//             payload: 'USER ASKED TO SEE LOANS'
//           }
//         ] : [
//           {
//             title: 'View More',
//             type: 'postback',
//             payload: payloadText
//           }
//         ]
//       }
//     }
//   };
//   return finalListTemplate;
// }

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

module.exports = {
  createListTemplate
};
