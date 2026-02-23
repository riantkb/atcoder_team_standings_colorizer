// ==UserScript==
// @name         AtCoder Team Standings Colorizer
// @namespace    https://github.com/riantkb/atcoder_team_standings_colorizer
// @version      0.2.0
// @description  AtCoder Team Standings Colorizer
// @author       riantkb
// @match        https://atcoder.jp/contests/*/standings/team
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @resource     style.css https://raw.githubusercontent.com/riantkb/atcoder_team_standings_colorizer/master/tampermonkey_script.css
// @updateURL    https://github.com/riantkb/atcoder_team_standings_colorizer/raw/master/AtCoder-Team-Standings-Colorizer.user.js
// ==/UserScript==

// @ts-check

// @ts-ignore
GM_addStyle(GM_getResourceText("style.css"));

/**
 * @param {number} ra
 * @param {number} rb
 */
function getWinProbability(ra, rb) {
  return 1 / (1 + 6 ** ((rb - ra) / 400));
}

/**
 * @param {number[]} team_ratings
 */
function aggregateRatings(team_ratings) {
  let left = 0.0;
  let right = 10000.0;
  for (let i = 0; i < 20; i++) {
    const r = (left + right) / 2;
    let rWinsProbability = 1;
    for (const rat of team_ratings) {
      rWinsProbability *= getWinProbability(r, rat);
    }
    if (rWinsProbability < 0.5) {
      left = r;
    } else {
      right = r;
    }
  }
  return Math.floor((left + right) / 2 + 0.5);
}

/**
 * @param {number} rating
 */
function getColorCode(rating) {
  if (rating <= 0) return "#000000";
  else if (rating < 400) return "#808080";
  else if (rating < 800) return "#804000";
  else if (rating < 1200) return "#008000";
  else if (rating < 1600) return "#00C0C0";
  else if (rating < 2000) return "#0000FF";
  else if (rating < 2400) return "#C0C000";
  else if (rating < 2800) return "#FF8000";
  else return "#FF0000";
}

/**
 * @param {number} rating
 */
function getSpanClass(rating) {
  if (rating <= 0) return "user-unrated";
  else if (rating < 400) return "user-gray";
  else if (rating < 800) return "user-brown";
  else if (rating < 1200) return "user-green";
  else if (rating < 1600) return "user-cyan";
  else if (rating < 2000) return "user-blue";
  else if (rating < 2400) return "user-yellow";
  else if (rating < 2800) return "user-orange";
  else return "user-red";
}

/**
 * @param {number} rating
 */
function generateTopcoderLikeCircle(rating) {
  if (rating >= 3600) {
    return `<span style="display: inline-block; border-radius: 50%; border-style: solid; border-width: 1px; height: 12px; width: 12px; border-color: rgb(255, 215, 0); background: linear-gradient(to right, rgb(255, 215, 0), white, rgb(255, 215, 0));"></span>`;
  }
  if (rating >= 3200) {
    return `<span style="display: inline-block; border-radius: 50%; border-style: solid; border-width: 1px; height: 12px; width: 12px; border-color: rgb(128, 128, 128); background: linear-gradient(to right, rgb(128, 128, 128), white, rgb(128, 128, 128));"></span>`;
  }
  const ccode = getColorCode(rating);
  const fill_ratio = rating >= 3200 ? 100 : (rating % 400) / 4;
  return `<span style="display: inline-block; border-radius: 50%; border-style: solid; border-width: 1px; height: 12px; width: 12px; border-color: ${ccode}; background: linear-gradient(to top, ${ccode} ${fill_ratio}%, rgba(0,0,0,0) ${fill_ratio}%);"></span>`;
}

/**
 * @param {string} tname
 * @param {number} trating
 */
function decorate(tname, trating) {
  const circle = generateTopcoderLikeCircle(trating);
  const circle_span = `<span class='tooltip1'>${circle}<div class='description1'>${trating}</div></span>`;
  return `${circle_span} <span class='${getSpanClass(trating)}'>${tname}</span>`;
}

/**
 * @param {Record<string, number>} ratings
 */
function heuristic(ratings) {
  if (ratings == undefined) {
    setTimeout(main, 2000);
    return;
  }
  const lines = document.querySelectorAll("tbody#standings-tbody > tr > td.standings-username");
  // console.log(lines.length);
  if (lines.length == 0) {
    setTimeout(heuristic, 3000, ratings);
    return;
  }

  for (const e of lines) {
    if (e.querySelector("span.gray.small50") == null) continue;
    if (e.querySelectorAll("span.tooltip1").length != 0) continue;

    const members = e.querySelectorAll("span.standings-affiliation > a");
    if (members.length == 0) continue;

    /** @type {number[]} */
    const team_ratings = [];
    for (const member of members) {
      const username = member.textContent?.trim() ?? "";
      if (!username) continue;

      const rating = username in ratings ? ratings[username] : 0;
      team_ratings.push(rating);

      // wrap member name by color span
      member.innerHTML = `<span class='${getSpanClass(rating)}'>${username}</span>`;
    }

    const agg_rating = aggregateRatings(team_ratings);

    const team = e.querySelector("a.username");
    if (team == null) continue;

    const teamspan = team.querySelector("span");
    if (teamspan == null) continue;

    const tname = teamspan.innerHTML;
    team.innerHTML = decorate(tname, agg_rating);
  }

  setTimeout(heuristic, 2000, ratings);
}

function main() {
  console.log(isHeuristic);
  if (isHeuristic) {
    const fetchurl = "https://raw.githubusercontent.com/riantkb/atcoder_rating_crawler/master/heuristic.json";
    fetch(fetchurl, { cache: "no-store" })
      .then((res) => res.json())
      .then((dic) => {
        const ratings = dic.data;
        heuristic(ratings);
      })
      .catch((_e) => {
        setTimeout(main, 3000);
      });
  }
}

(function () {
  "use strict";
  main();
})();
