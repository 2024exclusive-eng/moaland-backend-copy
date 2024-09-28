export default (err, req, res, next) => {
  console.error("🔴 ERRPR", err);
  return res
    .status(500)
    .json({ success: false, error: "Internal Server Error" });
};
