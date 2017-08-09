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
            title: 'Return To Main Menu',
            type: 'postback',
            payload: 'USER ASKED TO RETURN TO MAIN MENU'
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

function quickRepliesButton(title, payload, imageUrl) {
  return {
    content_type: 'text',
    title,
    payload,
    image_url: imageUrl || ''
  };
}

function createQuoteList(resultsFromRfqEngine, rfqId) {
  const onlyOneQuote = JSON.parse(resultsFromRfqEngine).quotes.length === 1;
  const quotesListTemplate = JSON.parse(resultsFromRfqEngine).quotes.reduce((result, quote) => {
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
          payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteId}::${quote.status}::${rfqId}`
        }
      ] : [
        {
          type: 'postback',
          title: 'View',
          payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteId}::${quote.status}::${rfqId}`
        }
      ]
    });
    return result;
  }, []);
  if (onlyOneQuote) {
    quotesListTemplate.push({
      title: 'No More Quotes',
      subtitle: 'You Can Check Again',
      buttons: [
        {
          type: 'postback',
          title: 'Try Again',
          payload: `USER ASKED TO SEE QUOTES:${rfqId}`
        }
      ]
    });
  }
  return quotesListTemplate;
}

function createRfqList(resultsFromRfqEngine) {
  const onlyOneRfq = JSON.parse(resultsFromRfqEngine).rfqs.length === 1;
  const rfqsListTemplate = JSON.parse(resultsFromRfqEngine).rfqs.map(rfq => ({
    title: `Your request for £${rfq.payload.loanAmount} over ${rfq.payload.loanTerm} ${rfq.payload.termPeriod}`,
    subtitle: `Created ${ta.ago(rfq.createdTimeStamp)}`,
    buttons: [
      {
        type: 'postback',
        title: 'Check For Quotes',
        payload: `USER ASKED TO SEE QUOTES:${rfq.rfqId}`
      }
    ]
  }));
  if (onlyOneRfq) {
    rfqsListTemplate.push({
      title: 'No More Loan Requests',
      subtitle: 'You Can Check Again',
      buttons: [
        {
          type: 'postback',
          title: 'Try Again',
          payload: 'USER ASKED TO SEE LOANS'
        }
      ]
    });
  }
  return rfqsListTemplate;
}

function mainMenu() {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Please Select An Action Below To Continue?',
        buttons: [
          {
            type: 'postback',
            title: 'Get A Loan',
            payload: 'USER ASKED TO CREATE A LOAN'
          },
          {
            type: 'postback',
            title: 'See Loans',
            payload: 'USER ASKED TO SEE LOANS'
          },
          {
            type: 'postback',
            title: 'Delete Loans',
            payload: 'USER ASKED TO DELETE A LOANS'
          }
        ]
      }
    }
  };
}


module.exports = {
  createListTemplate,
  createQuoteList,
  createRfqList,
  quickRepliesButton,
  mainMenu
};
