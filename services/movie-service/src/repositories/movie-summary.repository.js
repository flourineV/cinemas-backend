// src/repositories/movie-summary.repository.js

const MovieSummary = require("../entities/movie-summary.entity");

// BASIC QUERIES
function findById(id) {
  return MovieSummary.findById(id).exec();
}

function findAll() {
  return MovieSummary.find().exec();
}

function findByTmdbId(tmdbId) {
  return MovieSummary.findOne({ tmdbId }).exec();
}

function findByStatus(status, page, size) {
  return MovieSummary.find({ status })
    .skip(page * size)
    .limit(size)
    .exec();
}

function countByStatus(status) {
  return MovieSummary.countDocuments({ status }).exec();
}

function countAll() {
  return MovieSummary.countDocuments({}).exec();
}

function searchByTitle(keyword) {
  return MovieSummary.find({
    status: { $ne: "ARCHIVED" },
    title: { $regex: keyword, $options: "i" },
  }).exec();
}
//thêm api start_end
function findAvailableForRange(startDate, endDate) {
  return MovieSummary.find({
    status: { $in: ["NOW_PLAYING", "UPCOMING"] },
    startDate: { $exists: true, $ne: null, $lte: endDate },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: startDate } },
    ],
  }).exec();
}

// SAVE: insert hoặc update theo _id
async function save(entity) {
  // ưu tiên _id, vì đó là field thật trong DB
  if (entity._id) {
    return MovieSummary.findOneAndUpdate({ _id: entity._id }, entity, {
      upsert: true,
      new: true,
    }).exec();
  }

  // nếu entity chỉ có "id" (virtual) thì dùng nó làm _id
  if (entity.id) {
    return MovieSummary.findOneAndUpdate(
      { _id: entity.id },
      { ...entity, _id: entity.id },
      { upsert: true, new: true }
    ).exec();
  }

  // không có id nào → tạo mới
  return new MovieSummary(entity).save();
}

function update(id, updateData) {
  return MovieSummary.findByIdAndUpdate(id, updateData, { new: true }).exec();
}

function deleteById(id) {
  return MovieSummary.findByIdAndDelete(id).exec();
}

// MONTHLY STATS
async function countMoviesAddedByMonth() {
  const result = await MovieSummary.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        addedMovies: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return result.map((r) => ({
    year: r._id.year,
    month: r._id.month,
    addedMovies: r.addedMovies,
  }));
}

module.exports = {
  findById,
  findAll,
  findByTmdbId,
  findByStatus,
  findAvailableForRange,
  countByStatus,
  countAll,
  searchByTitle,
  save,
  update,
  deleteById,
  countMoviesAddedByMonth,
};
