// src/repositories/movie-detail.repository.js
const MovieDetail = require("../entities/movie-detail.entity");

// findById(UUID)
function findById(id) {
  return MovieDetail.findById(id).exec();
}

// findByTmdbId(Integer)
function findByTmdbId(tmdbId) {
  return MovieDetail.findOne({ tmdbId }).exec();
}

function findAll() {
  return MovieDetail.find().exec();
}

// save: nếu có _id / id thì update theo _id, không thì tạo mới
async function save(entity) {
  const _id = entity._id || entity.id; // id ảo từ virtual cũng được
  if (_id) {
    const data = { ...entity, _id };
    return MovieDetail.findOneAndUpdate({ _id }, data, {
      upsert: true,
      new: true,
    }).exec();
  }
  // fallback: không có _id/id thì để mongoose tự tạo
  const doc = new MovieDetail(entity);
  return doc.save();
}

function update(id, update) {
  return MovieDetail.findByIdAndUpdate(id, update, { new: true }).exec();
}

function deleteById(id) {
  return MovieDetail.findByIdAndDelete(id).exec();
}

module.exports = {
  findById,
  findByTmdbId,
  findAll,
  save,
  update,
  deleteById,
};
