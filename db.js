const low = require("lowdb");
const os = require("os");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync(
  os.homedir().replace(/\\/g, "/") + "/Desktop/" + "db.json"
);
const db = low(adapter);
db.defaults({ users: [] }).write();
module.exports = db;
