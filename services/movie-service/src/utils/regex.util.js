// Tương đương RegexUtil.escape trong Java
function escapeRegExp(str) {
  // thay các ký tự regex đặc biệt bằng \...
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { escapeRegExp };
