var MAX_PHOTOS = 21;
var LAYOUTS = [ 'STRETCH', 'CENTER_CROPPED', 'CENTER' ];

var photos = [];

var thumbsContainer = document.querySelector('#thumbs-container');
var searchTermInput = document.querySelector('#search-term');

function searchPhotos(searchTerm, pageToken, callback) {
  chrome.identity.getAuthToken({ interactive: true }, function(authToken) {
    if (chrome.runtime.lastError)
      return updateMessage(chrome.runtime.lastError.message);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.googleapis.com/plus/v1/activities' +
                    '?maxResults=20' + 
                    '&pageToken=' + (pageToken || '') + 
                    '&fields=items(object(attachments(fullImage/url,image/url,objectType))),nextPageToken'+
                    '&orderBy=best&query=' + searchTerm);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
    xhr.onload = callback;
    xhr.send();
  });
}

function updateMessage(message) {
  var existingThumbs = document.querySelectorAll('#thumbs-container div');
  for (var i = 0; i < existingThumbs.length; i++)
    existingThumbs[i].removeEventListener('click', setWallpaper);
  thumbsContainer.innerText = message;
}

function setWallpaper() {
  var thumb = this;
  var wallpaperInfo = {
    name: 'myCustomWallpaper',
    layout: LAYOUTS[thumb.layoutIndex],
    url: thumb.downloadUrl,
  };
  thumb.classList.add('downloading');
  chrome.wallpaper.setWallpaper(wallpaperInfo, function() {
    thumb.layoutIndex = (thumb.layoutIndex + 1) % LAYOUTS.length;
    thumb.classList.remove('downloading');
  });
}

function displayThumb(url, downloadUrl) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.onload = function() {
    var thumb = document.createElement('div');
    thumb.style.backgroundImage = 'url(' + URL.createObjectURL(xhr.response) + ')';
    thumb.downloadUrl = downloadUrl;
    thumb.layoutIndex = 0;
    thumb.addEventListener('click', setWallpaper);
    thumbsContainer.appendChild(thumb);
  };
  xhr.send();
}

function showPhotos(searchTerm, pageToken) {
  if (!pageToken) {
    photos = [];
    updateMessage('');
  }

  searchPhotos(searchTerm, pageToken, function(xhr) { 
    var posts = xhr.target.response.items;
    for (var i = 0; i < posts.length; i++) {
      var attachment = posts[i].object.attachments[0];
      if (attachment.objectType == 'photo') {
        var thumbUrl = attachment.image.url;
        displayThumb(thumbUrl, attachment.fullImage.url);
        photos.push(thumbUrl);
        if (photos.length >= MAX_PHOTOS)
          return;
      }
    }
    showPhotos(searchTerm, xhr.target.response.nextPageToken);
  });
};
 
searchTermInput.addEventListener('keyup', function(event) {
  if (event.keyCode == 13) {
    chrome.storage.local.set({ searchTerm: this.value });
    showPhotos(this.value);
  }
});

chrome.storage.local.get('searchTerm', function(data) {
  var searchTerm = data.searchTerm || 'photography';
  searchTermInput.value = searchTerm;
  showPhotos(searchTerm);
  searchTermInput.setSelectionRange(50,50);
});