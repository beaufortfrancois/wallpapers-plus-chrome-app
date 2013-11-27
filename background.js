chrome.app.runtime.onLaunched.addListener(function() {
  var width = 602;
  var height = 382;  
  var x = Math.round((screen.availWidth - width) / 2);
  var y = Math.round((screen.availHeight - height) / 2);

  chrome.app.window.create('index.html', {
      id: 'main', 
      bounds: { left: x, top: y, width: width, height: height }, 
      minWidth: width, 
      maxWidth: width,
      minHeight: height, 
      maxHeight: height, 
  });
});