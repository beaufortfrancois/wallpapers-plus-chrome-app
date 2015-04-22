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
    xhr.onloadend = function() {
      if (xhr.status === 200) {
        callback(xhr.response);
      } else if (xhr.status === 401) {
        // Removed cached token and try again.
        chrome.identity.removeCachedAuthToken({ token: authToken }, function() {
          searchPhotos(searchTerm, pageToken, callback);
        });
      }
    }
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
    filename: 'myCustomWallpaper',
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

function showPhotos(searchTerm, pageToken, callback) {
  searchPhotos(searchTerm, pageToken, function(response) {
    if (!pageToken) {
      photos = [];
      updateMessage('');
    }
    var posts = response.items;
    for (var i = 0; i < posts.length; i++) {
      var attachment = posts[i].object.attachments[0];
      if (attachment.objectType == 'photo') {
        var thumbUrl = attachment.image.url;
        displayThumb(thumbUrl, attachment.fullImage.url);
        photos.push(thumbUrl);
        if (photos.length >= MAX_PHOTOS) {
          callback & callback();
          return;
        }
      }
    }
    showPhotos(searchTerm, response.nextPageToken, callback);
  });
};

searchTermInput.addEventListener('keyup', function(event) {
  if (event.keyCode == 13) {
    chrome.storage.local.set({ searchTerm: this.value });
    showPhotos(this.value);
  }
});

chrome.storage.local.get('searchTerm', function(data) {
  var searchTerm = data.searchTerm || 'ratcliff';
  searchTermInput.value = searchTerm;
  showPhotos(searchTerm, null, function() {
    searchTermInput.focus();
    searchTermInput.setSelectionRange(50,50);
  });
});
