(function () {
  'use strict';

  var yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var origin = window.location.origin;
  var defaultBaseUrl = origin + '/api/v1';

  var setText = function (id, value) {
    var el = document.getElementById(id);
    if (el && value) {
      el.textContent = value;
    }
  };

  setText('meta-base-url', defaultBaseUrl);
  setText('info-base-url', defaultBaseUrl);

  var navDot = document.getElementById('nav-status-dot');
  var navText = document.getElementById('nav-status-text');
  var panelBadge = document.getElementById('panel-status-badge');
  var statusNote = document.getElementById('info-status-note');

  var setHealthy = function (data) {
    if (navDot) {
      navDot.classList.remove('is-error');
      navDot.classList.add('is-ok');
    }
    if (navText) {
      navText.textContent = 'API Operational';
    }
    if (panelBadge) {
      panelBadge.textContent = 'Operational';
      panelBadge.classList.remove('is-error');
      panelBadge.classList.add('is-ok');
    }

    if (data && typeof data === 'object') {
      if (data.service) {
        setText('meta-service', data.service);
        setText('info-service', data.service);
      }
      if (data.version) {
        setText('meta-version', data.version);
        setText('info-version', 'v' + data.version);
      }
      if (data.environment) {
        setText('meta-environment', data.environment);
        setText('info-environment', data.environment);
      }
      if (data.apiBasePath) {
        var resolvedBase = origin + data.apiBasePath;
        setText('meta-base-url', resolvedBase);
        setText('info-base-url', resolvedBase);
      }
      if (statusNote) {
        statusNote.textContent = 'Status: Operational (/health)';
      }
    }
  };

  var setDegraded = function () {
    if (navDot) {
      navDot.classList.remove('is-ok');
      navDot.classList.add('is-error');
    }
    if (navText) {
      navText.textContent = 'Status Unavailable';
    }
    if (panelBadge) {
      panelBadge.textContent = 'Unavailable';
      panelBadge.classList.remove('is-ok');
      panelBadge.classList.add('is-error');
    }
    if (statusNote) {
      statusNote.textContent = 'Health endpoint unreachable';
    }
  };

  fetch('/health', { headers: { Accept: 'application/json' } })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Health check returned HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (payload) {
      var data = payload && payload.data ? payload.data : null;
      if (data && data.status === 'ok') {
        setHealthy(data);
      } else {
        setDegraded();
      }
    })
    .catch(function () {
      setDegraded();
    });
})();
