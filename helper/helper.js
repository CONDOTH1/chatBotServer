function createRfqList(listGroupOfFour) {
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
            payload: 'VIEW MORE QUOTES:'
          }
        ]
      }
    }
  };
}

module.exports = {
  createRfqList
};
