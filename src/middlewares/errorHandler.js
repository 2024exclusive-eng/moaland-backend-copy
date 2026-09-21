export default (err, req, res, next) => {
  if (err.adminError) return res.status(err.status).json({success:false,error:{code:err.code,msg:err.message}});
  console.error('REQUEST_FAILED', { method: req.method, status: 500 });
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
};
