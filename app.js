const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const _ = require("lodash");
const puppeteer = require("puppeteer");
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("HOME");
});
app.post("/post-data", (req, res) => {
  let userIP = req.body.ip;
  delete req.body.ip;
  let userData = req.body;
  const users = db.get("users");
  const user = users.find({ userIP }).value();
  if (!user) {
    let user = { userIP, sessions: [userData] };
    users.push(user).write();
  } else {
    // using the condition below and check the time property to check user spam or not
    //if (!_.find(user.sessions, userData)) {
    user.sessions.push(userData);
    users.find({ userIP }).assign({ sessions: user.sessions }).write();
    //}
  }
  res.status(200).json({ message: "ok" });
});

app.post("/get-lyrics", async (req, res) => {
  let resp = await getLyrics(req.body.searchParam);
  res.status(200).json({ resp });
});

app.listen(port, () => {
  console.log("listening on port " + port);
});

const getLyrics = async (searchParam) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  //Acess to page contain the song
  await page.goto("https://www.nhaccuatui.com/tim-kiem?q=" + searchParam, {
    waitUntil: "load",
    timeout: 0,
  });
  const mvUrls = await page.evaluate(() => {
    let mvElms = document.querySelectorAll(
      ".sn_search_returns_list_song .sn_search_single_song > a"
    );
    // check mv exist
    if (mvElms) {
      return [...mvElms].map((mvElm) => mvElm.href);
    }
    return "";
  });
  // if no mv -> no lyric
  if (!mvUrls.length) {
    await browser.close();
    return "-1";
  }
  let lyric = "";
  for (let i = 0; i < mvUrls.length; i++) {
    // mv exist -> go to song page
    await page.goto(mvUrls[i], { waitUntil: "load", timeout: 0 });
    // get lyrics
    lyric = await page.evaluate(() => {
      let content = document.querySelector(".lyric #divLyric").textContent;
      if (!content.includes("- Hiện chưa có lời bài hát")) {
        content = content
          .replace(/\n+/g, "\n")
          .replace(/^\s+|\s+$/g, "")
          .trim();
        return content;
      }
      return "";
    });
    if (lyric !== "") {
      await browser.close();
      return lyric;
    }
  }
  await browser.close();
  return "0";
};

// postData({ ip, searchParam });
// link search page
// https://zingmp3.vn/tim-kiem/bai-hat.html?q=sao%20em%20vô%B4%20tình
// get mv link
// let mv_link = document.querySelector(".list-song-suggest .z-tooltip-btn[data-for^='mv-']").href;
// get lyrics
// let lyrics = document.querySelector(".lyrics-wrapper .lyrics-user-actions-wrapper .lyrics-actions-list .action-item.left a").getAttribute("data-clipboard-text");
