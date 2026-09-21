import { Router } from 'express';
import { SuperAdminOnly } from '../../middlewares/adminAccess.js';
import {
  listAccounts,
  saveAccount,
  usage,
} from '../../libs/adminManagement.js';
const router = Router();
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res)).catch(next);
router.get(
  '/me',
  wrap(async (req, res) => {
    const { tokenVersion, ...profile } = req.admin;
    res.json({
      success: true,
      data: { ...profile, usage: await usage(req.admin) },
    });
  })
);
router.use(SuperAdminOnly);
router.get(
  '/',
  wrap(async (req, res) =>
    res.json({ success: true, ...(await listAccounts(req.query)) })
  )
);
router.post(
  '/',
  wrap(async (req, res) =>
    res
      .status(201)
      .json({
        success: true,
        id: await saveAccount(req.admin, 'new', req.body),
      })
  )
);
router.put(
  '/:id',
  wrap(async (req, res) =>
    res.json({
      success: true,
      id: await saveAccount(req.admin, req.params.id, req.body),
    })
  )
);
export default router;
