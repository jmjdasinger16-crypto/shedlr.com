/* Post-checkout landing page.
   Stripe redirects the buyer here as .../portal/welcome.html?session_id={CHECKOUT_SESSION_ID}.
   We hand that session id to the worker, which verifies it against the Stripe API before
   provisioning the account, so a customer can always get in even if no email arrives. */
(function () {
  var $ = function (sel) { return document.querySelector(sel); };

  var loading = $('[data-welcome-loading]');
  var ready = $('[data-welcome-ready]');
  var active = $('[data-welcome-active]');
  var errorBox = $('[data-welcome-error]');

  function show(el) {
    [loading, ready, active, errorBox].forEach(function (node) { if (node) node.hidden = node !== el; });
  }

  function fail(message) {
    var text = $('[data-welcome-error-text]');
    if (text) text.textContent = message;
    show(errorBox);
  }

  /* Stripe appends its own params (and sometimes UTM codes); read only what we need. */
  var sessionId = new URLSearchParams(window.location.search).get('session_id') || '';

  if (!sessionId || sessionId.indexOf('cs_') !== 0) {
    fail('We could not find your checkout details in this link. If you just paid, check your email for an activation link.');
    return;
  }

  fetch('/api/portal/checkout-activation?session_id=' + encodeURIComponent(sessionId))
    .then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok || !result.data.success) {
        fail(result.data.error || 'We could not confirm your payment automatically.');
        return;
      }
      if (result.data.already_activated) { show(active); return; }

      var link = $('[data-welcome-link]');
      if (link && result.data.activation_token) {
        link.href = 'activate.html?token=' + encodeURIComponent(result.data.activation_token);
      }
      /* Only promise an email when the worker confirms one actually went out. */
      var emailed = $('[data-welcome-emailed]');
      var notEmailed = $('[data-welcome-not-emailed]');
      if (result.data.emailed && result.data.email) {
        var emailSpan = $('[data-welcome-email]');
        if (emailSpan) emailSpan.textContent = result.data.email;
        if (emailed) emailed.hidden = false;
      } else if (notEmailed) {
        notEmailed.hidden = false;
      }
      show(ready);
    })
    .catch(function () {
      fail('We could not reach our servers to finish setting up your account.');
    });
})();
