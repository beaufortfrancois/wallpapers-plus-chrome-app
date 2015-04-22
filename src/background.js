chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
      id: 'main',
      innerBounds: { width: 602, height: 382 },
      resizable: false,
      frame: { color: "#000000" },
  });
});
