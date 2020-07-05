let adminCommit = document.getElementById("admin-commit");
let adminInput = document.getElementById("admin-input");
let userInput = document.getElementById("user-input");
let result = document.getElementById("result");
let gotoCurChar = document.getElementById("goto-cur-char");
let preKey = null;
let preChar = true;
let preContent = "";
let ip = "";
const host = "http://localhost:3000";
(async () => {
  // get ip
  ip = await fetch("https://api.ipify.org")
    .then((res) => res.text())
    .then((data) => {
      removeLoader();
      return data;
    });
  let visit = true;
  await postData({ ip, visit }, "/post-data");
})();

Array.from([adminCommit, adminInput, userInput]).forEach((elm) => {
  elm.addEventListener("focus", ipCheck);
  elm.addEventListener("keypress", () => {
    if (!elm.style.animation) {
      elm.style.animation = "shake ease-in-out 1s infinite forwards";
      setTimeout(() => {
        elm.style.animation = "";
      }, 1000);
    }
  });
});
//

adminCommit.addEventListener("keydown", async (e) => {
  if (e.keyCode == 13) {
    let songName = standardString(adminCommit.value);
    let searchParam = songName
      .toLowerCase()
      .split("")
      .map((c) => (c == " " ? "+" : c))
      .join("");
    callLoader(true, adminCommit);
    let lyrics = await postData({ searchParam }, "/get-lyrics").then((resp) => {
      removeLoader();
      return resp;
    });
    switch (lyrics) {
      case "-1":
        alert("Không tìm thấy bài hát");
        break;
      case "0":
        alert("Không tìm thấy lời bài hát");
        break;
      default:
        renderContent(lyrics);
        adminCommit.value = "";
        userInput.focus();
        postData({ ip, songName }, "/post-data");
        break;
    }
  }
});

adminInput.addEventListener("keydown", async (e) => {
  // check input key is Enter
  if (e.keyCode == 13) {
    // check previous input key not Shift else Shift + Enter to make newline
    if (preKey !== 16) {
      // stop receive input
      e.preventDefault();
      // delete old user input and focus to it
      userInput.value = "";
      userInput.focus();
      // get admin content and standard it
      let setContent = adminInput.value;
      // check if admin content is empty
      if (setContent.length) {
        renderContent(setContent);
        // see server code to understand
        let data = { ip, setContent };
        postData(data, "/post-data");
      }
    }
  }
  // set the previous viriable to know it is Shift or not in the conditional statement above
  preKey = e.keyCode;
});

userInput.addEventListener("keydown", (e) => {
  // set the special key
  let isSpecialKey =
    (112 <= e.keyCode && e.keyCode <= 123) ||
    (33 <= e.keyCode && e.keyCode <= 34) ||
    (45 <= e.keyCode && e.keyCode <= 46) ||
    (18 <= e.keyCode && e.keyCode <= 19) ||
    e.keyCode == 145 ||
    e.keyCode == 27 ||
    e.keyCode == 9;
  // special key or hold key is not accepted
  if (isSpecialKey || e.repeat) {
    e.preventDefault();
    return;
  } else {
    // some key is necessary to use as Shift to uppercase charater, etc...
    if (
      (16 <= e.keyCode && e.keyCode <= 17) ||
      e.keyCode == 20 ||
      (35 <= e.keyCode && e.keyCode <= 40)
    ) {
      return;
    }
  }
  // check whether it is Backspace
  if (e.keyCode == 8) {
    // Nothing's in user input then nothing needs to remove
    if (!userInput.value.length) {
      // preChar to check previous char type true or false, it is true if nothing in user input
      preChar = true;
      e.preventDefault();
      return;
    } else {
      // get current char to set init-char class like not typed yet
      let curChar = document.querySelectorAll("#result span")[
        userInput.value.length - 1
      ];
      //check if current char is the first char, so the preChar is true
      if (userInput.value.length < 2) {
        preChar = true;
      } else {
        // if not let compare className of previous to set the preChar
        preChar = curChar.previousSibling.className == "true-char";
        // scroll to previous char will to be current char
        curChar.previousSibling.scrollIntoView();
      }
      // set current char to normal
      curChar.className = "init-char";
      // if (!userInput.value.length) {
      //   preChar = true;
      // }
      return;
    }
  }
  if (userInput.value.length == result.childNodes.length) {
    e.preventDefault();
    return;
  }
  let curChar = document.querySelectorAll("#result span")[
    userInput.value.length
  ];
  curChar.scrollIntoView();
  if (e.key == curChar.textContent[0] && preChar) {
    curChar.className = "true-char";
  } else {
    if (e.key == "Enter" && curChar.textContent[0].charCodeAt(0) == 10) {
      curChar.className = "true-char";
      return;
    }
    if (curChar.textContent[0].charCodeAt(0) == 32) {
      curChar.className = "space-false-char";
    } else {
      curChar.className = "false-char";
    }
    preChar = false;
  }
});

function renderContent(content) {
  // map it to span tag with init-char class
  let resultContent = content
    .split("")
    .map((c) => {
      if (c.charCodeAt(0) == 10) {
        c = "\n";
      } else if (c.charCodeAt(0) == 8216 || c.charCodeAt(0) == 8217) {
        c = "'";
      } else if (c.charCodeAt(0) == 8220 || c.charCodeAt(0) == 8221) {
        c = '"';
      }
      return `<span class="init-char">${c}</span>`;
    })
    .join("");
  // put it into result tag and set result tag visible
  result.innerHTML = resultContent;
  result.style.display = "block";
}

function standardString(str) {
  // Gộp nhiều dấu space thành 1 space
  str = str.replace(/\s+/g, " ");
  // loại bỏ toàn bộ dấu space (nếu có) ở 2 đầu của xâu
  return str.trim();
}

function ipCheck() {
  let cdt = !ip.length;
  let elm = this;
  callLoader(cdt, elm);
}

function removeLoader() {
  if (document.querySelector(".loading")) {
    document.querySelector(".wrapper > *[disabled]").disabled = false;
    document.querySelector(".loading").style.opacity = "0";
    setTimeout(() => {
      document.querySelector(".loading").remove();
    }, 200);
  }
}

function callLoader(cdt, elm) {
  if (cdt) {
    removeLoader();
    let loader = document.createElement("div");
    let rect = elm.getBoundingClientRect();
    let posX = rect.left + rect.width / 2;
    let posY = rect.top + rect.height / 2;
    loader.className = "loading";
    loader.style.left = `${posX}px`;
    loader.style.top = `${posY}px`;
    elm.parentNode.appendChild(loader);
    loader.style.opacity = 1;
    elm.disabled = true;
  }
}

async function postData(data, path) {
  // remember send the response back to avoid client re-fetch
  data.time = new Date().toString();
  let resp = await fetch(host + path, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(data), // remember JSON.stringify
  })
    .then((res) => res.json())
    .then((data) => data.resp);
  return new Promise((resolve, reject) => {
    resolve(resp);
  });
}
