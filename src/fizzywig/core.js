fizzywig = {
  version: '0.0.1',
  block_elements: ['p', 'pre', 'Normal'],
  inline_elements: ['b', 'i', 'strong', 'em', 'a', 'del', 'strike'],
  void_elements: ['img', 'br', 'hr']
};

// heading levels
[1, 2, 3, 4, 5, 6].forEach(function(i) {
  fizzywig.block_elements.push('Heading ' + i);
  fizzywig.block_elements.push('h' + i);
});

