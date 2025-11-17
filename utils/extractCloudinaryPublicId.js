const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;

    let after = url.substring(idx + marker.length);

    after = after.split("?")[0];
    after = after.replace(/^v\d+\//, "");
    after = after.replace(/\.[^/.]+$/, "");

    return after || null;
  } catch (e) {
    return null;
  } 
};

module.exports = { extractCloudinaryPublicId };
