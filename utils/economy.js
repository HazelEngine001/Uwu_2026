const User = require("../database/userModel");

async function getUser(id) {
  let user = await User.findById(id);
  if (!user) user = await User.create({ _id: id });
  return user;
}

module.exports = { getUser };
