const deleteUserDetail = async (model, detailId, userId) => {
  if (!detailId) {
    throw new Error("ID detail diperlukan");
  }

  const existing = await model.findOne({
    where: { id: detailId, userId },
  });

  if (!existing) {
    const error = new Error("Data tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  await existing.destroy();
};

module.exports = { deleteUserDetail };