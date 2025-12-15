export default (req, res, next) => {
  return res.status(404).json({ success: false, msg: "Not found" });
};
