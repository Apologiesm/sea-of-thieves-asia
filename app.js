/*
 * Sea of Thieves Asia — placeholder-safe renderer.
 *
 * This file never invents content. It only reads config.js and renders
 * "Coming soon" for any REPLACE_BEFORE_LAUNCH value and an empty state
 * for any EMPTY_FOR_BETA collection. No anchor element is created for a
 * placeholder link, so no fake-looking URL can ever be clicked.
 */
(function () {
  "use strict";

  var config = window.SITE_CONFIG;
  if (!config) {
    console.error("SITE_CONFIG missing — check config.js is loaded first.");
    return;
  }

  var PLACEHOLDER = "REPLACE_BEFORE_LAUNCH";
  var EMPTY = "EMPTY_FOR_BETA";
  var comingSoon = config.messages.comingSoon;
  var emptyMessage = config.messages.emptyCollection;

  var linkLabels = {
    discord: "Discord",
    youtube: "YouTube",
    twitch: "Twitch",
    x: "X",
    instagram: "Instagram",
    tiktok: "TikTok",
    email: "Contact email"
  };

  function renderLinks() {
    var list = document.getElementById("link-list");
    if (!list) return;
    list.textContent = "";

    Object.keys(linkLabels).forEach(function (key) {
      var value = config.links[key];
      var li = document.createElement("li");
      li.className = "link-card";
      li.setAttribute("data-key", key);

      var label = document.createElement("span");
      label.className = "label";
      label.textContent = linkLabels[key];

      var detail = document.createElement("span");
      detail.className = "value";

      if (value === PLACEHOLDER) {
        // Deliberately a <span>, not an <a>. No fake clickable link.
        detail.textContent = comingSoon;
        li.setAttribute("data-placeholder", PLACEHOLDER);
      } else if (typeof value === "string" && value.length > 0) {
        // Real value supplied by the owner: render a real link.
        var a = document.createElement("a");
        a.href = value;
        a.textContent = value;
        a.rel = "noopener noreferrer";
        if (/^https?:/i.test(value)) a.target = "_blank";
        detail.appendChild(a);
      } else {
        detail.textContent = comingSoon;
      }

      li.appendChild(label);
      li.appendChild(detail);
      list.appendChild(li);
    });
  }

  function renderCollection(key) {
    var el = document.getElementById(key + "-content");
    if (!el) return;
    el.textContent = "";

    var value = config.collections[key];
    var p = document.createElement("p");
    if (value === EMPTY) {
      p.textContent = emptyMessage;
      el.setAttribute("data-empty", EMPTY);
    } else {
      // Future real data is not implemented in beta. Never fabricate entries.
      p.textContent = emptyMessage;
    }
    el.appendChild(p);
  }

  function renderContact() {
    var el = document.getElementById("contact-line");
    if (!el) return;
    var email = config.links.email;
    el.textContent = email === PLACEHOLDER
      ? "Contact: " + comingSoon
      : "Contact: " + email;
  }

  renderLinks();
  ["events", "announcements", "guides", "gallery", "crewListings"].forEach(renderCollection);
  renderContact();
})();
