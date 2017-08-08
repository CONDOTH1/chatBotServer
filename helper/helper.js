const ta = require('time-ago')();

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

function quickRepliesButton(title, payload, imageUrl) {
  return {
    content_type: 'text',
    title,
    payload,
    image_url: imageUrl || ''
  };
}

function createQuoteList(resultsFromRfqEngine, rfqNumber) {
  const quotesListTemplate = resultsFromRfqEngine.quotes.reduce((result, quote) => {
    if (quote.status === 'declined') {
      return result;
    }
    result.push({
      title: `${quote.quotePayload.providerName} can offer a loan of £${quote.quotePayload.borrowingAmount} at ${quote.quotePayload.representativeApr}%`,
      subtitle: `Valid For ${Math.ceil((quote.timeToLive - new Date()) / 86400000)} Days`,
      buttons: quote.status !== 'pending' ? [
        {
          type: 'postback',
          title: `View: ${quote.status}ed`,
          payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteNumber}::${quote.status}::${rfqNumber}`
        }
      ] : [
        {
          type: 'postback',
          title: 'View',
          payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteNumber}::${quote.status}::${rfqNumber}`
        }
      ]
    });

    return result;
  }, []);
  return quotesListTemplate;
}

function createRfqList(resultsFromRfqEngine) {
  const rfqsListTemplate = JSON.parse(resultsFromRfqEngine).rfqs.map(rfq => ({
    title: `Your request for £${rfq.payload.loanAmount} over ${rfq.payload.loanTerm} ${rfq.payload.termPeriod}`,
    subtitle: `Created ${ta.ago(rfq.createdTimeStamp)}`,
    buttons: [
      {
        type: 'postback',
        title: 'Check For Quotes',
        payload: `USER ASKED TO SEE QUOTES:${rfq.rfqNumber}`
      }
    ]
  }));
  return rfqsListTemplate;
}


module.exports = {
  createListTemplate,
  acceptButton,
  rejectButton,
  returnButton,
  createQuoteList,
  createRfqList,
  quickRepliesButton
};
